# MedLocker HAPI FHIR Server (custom)

This module builds a custom HAPI FHIR server based on the official jpaserver-starter.
We overlay our `pom.xml` to control features (IPS, CR, MDM, Prometheus, etc.) and use env-driven configuration.

## Local build + run (via top-level docker-compose)
docker-compose build --no-cache hapi
docker-compose up hapi

Browse: http://localhost:8080/fhir/metadata

## Profiles (for GCP Cloud SQL)
To use the Cloud SQL Socket Factory at build time:
- Keep the `cloudsql-postgres` profile in `pom.xml`.
- At runtime in Cloud Run/K8s, set SPRING_DATASOURCE_URL to:
  jdbc:postgresql:///<DB_NAME>?socketFactoryArg=<PROJECT>:<REGION>:<INSTANCE>&socketFactory=com.google.cloud.sql.postgres.SocketFactory&user=<USER>&password=<PWD>
and keep `driver class` as `org.postgresql.Driver`.
