import { Deployment, Protocol, Volume } from "npm:cdk8s-plus-27";
import { Chart } from "npm:cdk8s";

export function createHomeAssistantDeployment(chart: Chart) {
  const deployment = new Deployment(chart, "homeassistant", {
    replicas: 1,
  });

  // TODO: add mdns repeater
  deployment.addContainer({
    image: "ghcr.io/home-assistant/home-assistant:stable",
    ports: [
      {
        name: "port-8123-web",
        number: 8123,
        protocol: Protocol.TCP,
      },
      {
        // homekit
        name: "port-5353",
        number: 5353,
        protocol: Protocol.TCP,
      },
      {
        // homekit
        name: "port-21063",
        number: 21063,
        protocol: Protocol.TCP,
      },
      {
        // homekit
        name: "port-21064",
        number: 21064,
        protocol: Protocol.TCP,
      },
      {
        // homekit
        name: "port-21065",
        number: 21065,
        protocol: Protocol.TCP,
      },
      {
        // homekit
        name: "port-21066",
        number: 21066,
        protocol: Protocol.TCP,
      },
    ],
    securityContext: {
      ensureNonRoot: false,
      readOnlyRootFilesystem: false,
    },
    resources: {},
    volumeMounts: [
      {
        volume: Volume.fromHostPath(
          chart,
          "homeassistant-bind-mount",
          "homeassistant-bind-mount",
          {
            path: "/mnt/storage/data/homeassistant-config",
          }
        ),
        path: "/config",
      },
    ],
  });

  const service = deployment.exposeViaService({
    ports: [
      {
        port: 443,
        targetPort: 8123,
      },
    ],
  });

  service.metadata.addAnnotation("tailscale.com/expose", "true");
  service.metadata.addAnnotation("tailscale.com/hostname", "homeassistant");
}
