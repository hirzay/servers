import { Deployment, Ingress, IngressBackend, Service } from "npm:cdk8s-plus-27";
import { ApiObject, Chart } from "npm:cdk8s";

export function createBazarrDeployment(chart: Chart) {
  const deployment = new Deployment(chart, "bazarr", {
    replicas: 1,
  });

  deployment.addContainer({
    image: "lscr.io/linuxserver/bazarr",
    portNumber: 6767,
    securityContext: {
      ensureNonRoot: false,
      readOnlyRootFilesystem: false,
    },
    resources: {},
  });

  const service = new Service(chart, "bazarr-service", {
    selector: deployment,
    ports: [
      {
        name: "https",
        port: 443,
        targetPort: 6767,
      },
    ],
  });

  const ingress = new Ingress(chart, "bazarr-ingress", {
    defaultBackend: IngressBackend.fromService(service),
  });

  // TODO
  // https://cdk8s.io/docs/latest/basics/escape-hatches/#patching-api-objects-directly
  // https://tailscale.com/kb/1236/kubernetes-operator/#ingress-resource
  // ApiObject.of(ingress).addJsonPatch();

  deployment.exposeViaIngress("/", {
    ingress,
  });

  service.metadata.addAnnotation("tailscale.com/expose", "true");
  service.metadata.addAnnotation("tailscale.com/hostname", "bazarr");
}