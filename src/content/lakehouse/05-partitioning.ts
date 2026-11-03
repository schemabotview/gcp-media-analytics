import type { Section } from '../types'

export const partitioning: Section = {
  id: 'partitioning',
  title: 'Partitioning and clustering',
  scene: 'lake-partitions',
  narration:
    "BigQuery bills by the bytes a query reads, so the cheapest byte is the one it never touches. This step was recorded on Google Cloud. The question is the second half's busiest minute on the derby's channel. A small script asks BigQuery twice: first a dry run, which is free and only estimates, then the real query with a cap on what it may bill. Against Bronze as it stands, one undivided table, the answer is eighteen forty one with two thousand one hundred and forty households, and it reads about twelve million bytes, every row's time, channel and household. The editor shows the change. Bronze is now split into a partition per hour of event time, and inside each partition the rows are sorted by channel, then title. Partitioning is decided when a table is made, so Terraform's plan says the table must be replaced, and the apply drops it and makes it again. The night is loaded once more, and the same question reads about six and a half million bytes, roughly half. The filter names the second half, so only two hourly partitions are opened, and inside them clustering lets BigQuery skip the other channels' blocks. The dry run already knew: partitions are pruned before a query runs. The bill shows ten megabytes, BigQuery's smallest charge for a query. Next, the rows Silver should never trust.",
}
