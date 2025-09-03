# ---------- Build stage ----------
FROM maven:3.9-eclipse-temurin-17 AS build

ARG STARTER_GIT=https://github.com/hapifhir/hapi-fhir-jpaserver-starter.git
ARG STARTER_REF=image/v8.2.0-2
# NEW: toggle to include Cloud SQL deps
ARG CLOUDSQL=false

WORKDIR /workspace

RUN git clone --depth 1 ${STARTER_GIT} starter \
 && cd starter \
 && if [ "${STARTER_REF}" != "main" ]; then \
      git fetch --depth 1 origin ${STARTER_REF} || git fetch --tags origin ${STARTER_REF}; \
      git checkout FETCH_HEAD || git checkout ${STARTER_REF}; \
    fi

# overlay POM and resources
COPY pom.xml                 /workspace/starter/pom.xml
COPY src/main/resources/     /workspace/starter/src/main/resources/

WORKDIR /workspace/starter
# If CLOUDSQL=true, activate both boot and cloudsql-postgres profiles
RUN --mount=type=cache,target=/root/.m2 \
    mvn -DskipTests clean package \
        -Pboot$( [ "${CLOUDSQL}" = "true" ] && printf ",cloudsql-postgres" )

# ---------- Runtime stage ----------
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /workspace/starter/target/ROOT.war /app/ROOT.war

EXPOSE 8080
ENV HAPI_FHIR_IPS_ENABLED=true
ENV JAVA_TOOL_OPTIONS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=70 -Djava.security.egd=file:/dev/./urandom"
ENTRYPOINT ["java","-jar","/app/ROOT.war"]
