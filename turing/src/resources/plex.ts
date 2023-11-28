import {
  Deployment,
  EmptyDirMedium,
  EnvValue,
  Ingress,
  IngressBackend,
  Protocol,
  Service,
  Volume,
} from "npm:cdk8s-plus-27";
import { ApiObject, Chart, JsonPatch, Size } from "npm:cdk8s";

export function createPlexDeployment(chart: Chart) {
  const deployment = new Deployment(chart, "plex", {
    replicas: 1,
  });

  // TODO: attach GPU, https://docs.k3s.io/advanced#nvidia-container-runtime-support
  // https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/latest/install-guide.html
  // https://github.com/NVIDIA/k8s-device-plugin#quick-start
  // https://kubernetes.io/docs/tasks/manage-gpus/scheduling-gpus/
  // https://github.com/NVIDIA/nvidia-container-toolkit
  // TODO: pass through TV tuner device, /dev/dvb:/dev/dvb
  deployment.addContainer({
    image: "plexinc/pms-docker",
    envVariables: {
      ADVERTISE_IP: EnvValue.fromValue(
        "https://plex.ts.zeus.sjer.red,https://plex.public.zeus.sjer.red"
      ),
      // NVIDIA_DRIVER_CAPABILITIES: EnvValue.fromValue("all"),
      // NVIDIA_VISIBLE_DEVICES:  EnvValue.fromValue("all")
    },
    // https://support.plex.tv/articles/201543147-what-network-ports-do-i-need-to-allow-through-my-firewall/
    ports: [
      {
        name: "port-32400-web",
        number: 32400,
        hostIp: "0.0.0.0",
        hostPort: 32400,
        protocol: Protocol.TCP,
      },
      {
        name: "port-1900-dlna",
        number: 1900,
        hostPort: 1900,
        protocol: Protocol.UDP,
      },
      {
        // bonjour
        name: "port-5353",
        number: 5353,
        hostPort: 5353,
        protocol: Protocol.UDP,
      },
      {
        // companion
        name: "port-3005",
        number: 3005,
        hostPort: 3005,
        protocol: Protocol.TCP,
      },
      {
        name: "port-8324-roku",
        number: 8324,
        hostPort: 8324,
        protocol: Protocol.TCP,
      },
      {
        name: "port-32469-dlna",
        number: 32469,
        hostPort: 32469,
        protocol: Protocol.TCP,
      },
      {
        name: "port-32410-gdm",
        number: 32410,
        hostPort: 32410,
        protocol: Protocol.UDP,
      },
      {
        name: "port-32412-gdm",
        number: 32412,
        hostPort: 32412,
        protocol: Protocol.UDP,
      },
      {
        name: "port-32413-gdm",
        number: 32413,
        hostPort: 32413,
        protocol: Protocol.UDP,
      },
      {
        name: "port-32414-gdm",
        number: 32414,
        hostPort: 32414,
        protocol: Protocol.UDP,
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
          "plex-config-bind-mount",
          "plex-config-bind-mount",
          {
            path: "/mnt/storage/plex",
          }
        ),
        path: "/config",
      },
      {
        volume: Volume.fromHostPath(
          chart,
          "plex-tv-bind-mount",
          "plex-tv-bind-mount",
          {
            path: "/mnt/storage/media/tv",
          }
        ),
        path: "/data/tv",
      },
      {
        volume: Volume.fromHostPath(
          chart,
          "plex-movies-bind-mount",
          "plex-movies-bind-mount",
          {
            path: "/mnt/storage/media/movies",
          }
        ),
        path: "/data/movies",
      },
      {
        volume: Volume.fromHostPath(
          chart,
          "plex-other-bind-mount",
          "plex-other-bind-mount",
          {
            path: "/mnt/storage/media/other",
          }
        ),
        path: "/data/other",
      },
      {
        volume: Volume.fromHostPath(
          chart,
          "plex-music-bind-mount",
          "plex-music-bind-mount",
          {
            path: "/mnt/storage/media/music",
          }
        ),
        path: "/data/music",
      },
      {
        volume: Volume.fromEmptyDir(chart, "plex-shm-mount", "plex-shm-mount", {
          medium: EmptyDirMedium.MEMORY,
          sizeLimit: Size.gibibytes(8),
        }),
        path: "/transcode",
      },
    ],
  });

  const service = new Service(chart, "plex-service", {
    selector: deployment,
    ports: [{ name: "https", port: 443, targetPort: 32400 }],
  });

  const ingress = new Ingress(chart, "plex-ingress", {
    defaultBackend: IngressBackend.fromService(service, {
      port: 443,
    }),
    tls: [
      {
        hosts: ["plex"],
      },
    ],
  });

  ApiObject.of(ingress).addJsonPatch(
    JsonPatch.add("/spec/ingressClassName", "tailscale")
  );
}
