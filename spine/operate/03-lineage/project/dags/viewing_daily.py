"""viewing-pulse, every night: wait for the night, load it, judge it, clean
it, answer, and check the answer. One run per night: the run's logical date
(ds) IS the night, so any night can be run again and gives the same tables.
"""
from datetime import datetime, timedelta

from airflow import DAG
from airflow.operators.bash import BashOperator
from airflow.providers.google.cloud.operators.bigquery import (
    BigQueryCheckOperator, BigQueryInsertJobOperator)
from airflow.providers.google.cloud.operators.dataproc import (
    DataprocCreateBatchOperator)
from airflow.providers.google.cloud.sensors.gcs import (
    GCSObjectExistenceSensor)

RAW = "{{ var.value.raw_bucket }}"


def sql(task_id: str) -> BigQueryInsertJobOperator:
    """warehouse/<task_id>.sql as one BigQuery job, for the run's night."""
    return BigQueryInsertJobOperator(task_id=task_id, configuration={
        "query": {"query": "{% include '" + task_id + ".sql' %}",
                  "useLegacySql": False, "maximumBytesBilled": "200000000",
                  "queryParameters": [{
                      "name": "dt", "parameterType": {"type": "DATE"},
                      "parameterValue": {"value": "{{ ds }}"}}]}})


def gate(name: str) -> BigQueryCheckOperator:
    """Fails the task unless the gate's latest verdict for the night passed."""
    return BigQueryCheckOperator(
        task_id=f"gate_{name.lower()}", use_legacy_sql=False,
        sql=f"SELECT passed FROM audit.gate_results WHERE gate = '{name}' "
            "AND dt = '{{ ds }}' ORDER BY checked_at DESC LIMIT 1")


with DAG("viewing_daily", schedule="30 2 * * *",
         start_date=datetime(2026, 10, 31), catchup=False,
         max_active_runs=1,
         template_searchpath=["/home/priya/viewing-pulse/warehouse"],
         default_args={
             "email": ["media-data@sun.example"], "email_on_failure": True,
             # a blip (a 503, a quota) is retried; a real failure is not
             # hidden for long: two retries, a minute apart
             "retries": 2, "retry_delay": timedelta(minutes=1),
             # and the night is late if a task has not finished by 06:30
             "sla": timedelta(hours=4)}) as dag:
    landed = GCSObjectExistenceSensor(
        task_id="viewing_landed", bucket=RAW,
        object="source=viewing/dt={{ ds }}/_SUCCESS",
        mode="reschedule", poke_interval=300, timeout=6 * 3600)
    qos = DataprocCreateBatchOperator(
        task_id="qos_by_exchange", region="europe-west2",
        batch_id="qos-{{ ds_nodash }}-{{ ti.try_number }}", batch={
            "pyspark_batch": {
                "main_python_file_uri": "{{ var.value.qos_job }}",
                "args": ["--dt", "{{ ds }}", "--raw", f"gs://{RAW}",
                         "--write"]},
            "runtime_config": {"version": "3.0"},
            "environment_config": {"execution_config": {
                "subnetwork_uri": "sn-dataproc",
                "service_account": "{{ var.value.dataproc_sa }}"}}})

    # the guide is JSON BigQuery cannot read in place: §8.9's loader
    epg = BashOperator(
        task_id="epg", cwd="/home/priya/viewing-pulse",
        bash_command=".venv/bin/python warehouse/epg.py --dt {{ ds }}")

    (landed >> sql("bronze") >> sql("g2") >> gate("G2") >> sql("silver")
     >> epg >> sql("g3") >> gate("G3") >> [qos, sql("gold_content")])
    dag.get_task("gold_content") >> sql("g4") >> gate("G4")
