# Airflow on Priya's laptop: its own venv on Python 3.12 (Composer 3's
# image runs Airflow 2.10.5, which stops at 3.12), its own home, and the
# DAGs from the project. `source airflow/env.sh` before any airflow command.
export AIRFLOW_HOME=$HOME/viewing-pulse/airflow
export AIRFLOW__CORE__DAGS_FOLDER=$HOME/viewing-pulse/dags
export AIRFLOW__CORE__LOAD_EXAMPLES=False
source $AIRFLOW_HOME/.venv/bin/activate
