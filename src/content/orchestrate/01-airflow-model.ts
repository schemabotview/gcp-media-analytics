import type { Section } from '../types'

export const airflowModel: Section = {
  id: 'airflow-model',
  title: 'Airflow’s model',
  scene: 'orch-model',
  narration:
    "Everything so far was run by hand, one step at a time. Every night it has to run by itself, in order, and stop when something is wrong. That is orchestration, and on Google Cloud it is Apache Airflow, managed as Cloud Composer. This frame is a concept, and its label cites Airflow's and Composer's documentation. On the left, what Priya writes: a D A G, a graph of tasks with no cycles, one run per night. Some tasks are sensors, which wait for something outside, like the night's files. Most are operators, each one kind of work: a BigQuery job, a Dataproc batch, a shell command. And some are checks, tasks whose only job is to fail when a gate failed. On the right, what runs it. The scheduler reads the folder of D A G files, makes a run for each night, and queues a task once everything upstream of it has succeeded. Workers run the tasks and report each one's state: success, up for retry, or failed. A metadata database remembers every run and every try. Airflow does no data work itself. It decides when BigQuery and Dataproc should, and what happens when they fail. Next, the D A G for viewing pulse.",
}
