---
title: "Kubernetes from the Ground Up: A Senior Engineer's Deep Dive"
description: "Master Kubernetes internals - from control plane scheduling and container runtimes to resource limits, cgroups, and rolling updates."
pubDate: "2026-06-07"
author: "Aunmoy Dey Tanmoy"
tags: ['Kubernetes', 'DevOps', 'Infrastructure', 'Containers']
image: "/blog-assets/kubernetes-core-architecture-notes.svg"
---

Kubernetes from the Ground Up: A Senior Engineer’s Deep Dive1st Part-The first part of this note covered the historical context, deep component internals, and a lowlevel walkthrough of a rolling update.

## 1. Why Orchestration? The Road from Bare Metal to Containers

The Traditional PainIn the precloud era, developers wrote code and then had to replicate an entire environment manually: buy a physical server, obtain a static IP, install the OS, configure dependencies (Redis v6, PostgreSQL 14), copy the code via FTP/Git, and pray it ran. The infamous “works on my machine” problem was the norm. Scaling meant buying more hardware, swapping CPUs, adding RAM – a slow, costly process that required dedicated personnel. This was the static deployment world.
Cloud’s Partial AnswerAWS (and later others) made ondemand virtual machines available with a few clicks. No more procurement, but the fundamental problem remained: you still had to replicate the entire OS, middleware, and application on every instance. Custom AMIs were heavy, slow to share, and didn’t guarantee the runtime behaviour would match your laptop. Scaling became easier (Auto Scaling Groups), but it was still infrastructurecentric, and you were now locked into a specific cloud provider’s idioms (ECS task definitions, ELB, CloudFront).
Containers: Lightweight, Portable UnitsContainers (popularised by Docker) solved the “works on my machine” problem at a higher level. By sharing the host kernel and packaging only the application + its userspace dependencies, containers became:
Lightweight – tens of MB, not GBs.
Portable – a container image runs identically anywhere.
Fast to start/stop – enabling rapid scaling.
But containers by themselves introduced a new challenge: how do you manage thousands of them across hundreds of machines? You need to schedule them, keep them running, scale them, connect them, and collect their logs. Doing this manually is impossible. This is the container orchestration problem.
| Layer              | Components                                                |
| ------------------ | --------------------------------------------------------- |
| Control Plane      | etcd, kubeapiserver, kubescheduler, kubecontrollermanager |
| Data Plane (Nodes) | kubelet, kubeproxy, container runtime (containerd/CRIO)   |
All state is in etcd. Only the API server talks to etcd. Everything else consumes state via the API server’s watch API. This clean separation is the foundation of Kubernetes’ resilience and extensibility.


## 3. Control Plane Components – Deep Dive


## 3.1 etcd

- What it is: A distributed, strongly consistent keyvalue store using the Raft consensus algorithm.
Role: Stores all cluster state – the desired state of every object (Pods, ReplicaSets, Deployments, ConfigMaps, Secrets, etc.) and the current status reported by components.
- Access pattern: Only the API server reads/writes; all other components get their data via the API server, not etcd directly.
Optimistic concurrency: Every object has a resourceVersion. Writers must pass the version they last read, preventing lost updates. Controllers are designed to handle conflicts and retry.

## 3.2 kubeapiserver (API Server)

- Central hub: The only component that interacts with etcd. Provides a RESTful interface over HTTPS.
- Functions:
- Authentication (certs, tokens, OIDC) and authorisation (RBAC).
Admission control: a chain of plugins that can mutate or validate objects before they are persisted (e.g., PodNodeSelector, LimitRanger).
- Serves watch endpoints – longlived HTTP connections that push object changes to clients. This is the backbone of the entire eventdriven control loop.
Why it matters: The API server is the declarative interface. A kubectl apply merely creates/updates objects in etcd; all real action is driven by controllers reacting to those objects.

## 3.3 kubescheduler

Watch: Unscheduled Pods (.spec.nodeName empty).
Filtering (predicates): Remove nodes that lack sufficient resources, violate taints/tolerations, or don’t match node selectors/affinity.
Scoring (priorities): Rank remaining nodes by weighted criteria (least requested, balanced resource allocation, custom scores).
Binding: Picks the highestscoring node and creates a Binding subobject (a POST to the pod’s binding subresource). This sets the pod’s nodeName. The scheduler never starts containers; it just assigns pods to nodes.
- Extensible: Can be replaced or extended with custom scheduler plugins or multiple schedulers.

## 3.4 kubecontrollermanager

- A single binary running multiple controllers as goroutines. Key ones for our scenario:
Deployment controller – manages Deployments and creates/updates ReplicaSets.
ReplicaSet controller – ensures the right number of Pods exist for each ReplicaSet.
Service & Endpoints controllers – manage ClusterIPs and endpoint slices.
- Shared informer pattern: Each controller uses local caches populated by watching the API server. This drastically reduces API load and enables fast, memorylocal state evaluation.
- Work queue: Events cause object keys to be enqueued; worker goroutines process them serially per object, with builtin rate limiting and retries.
Reconciliation loop: On every event (or periodic resync), compare current observed state (cache) with desired state (.spec) and drive toward the latter. This is a leveltriggered, not edgetriggered, system. Missed events are harmless because the next sync will correct.


## 4. Node Components – Where the Work Happens


## 4.1 kubelet

Node agent running on every worker.
Pod lifecycle manager: Watches Pods assigned to its node (via API server with a fieldSelector=spec.nodeName=<node>). Alternatively, can use static pod manifests.
Sync loop (per Pod):
- Create the “pause” (infrastructure) container that holds the pod’s network namespace.
Pull images according to imagePullPolicy.
- Start/stop containers in the order defined, injecting environment, volumes, probes.
Execute liveness/readiness probes and continuously update the pod’s status (phase, conditions, container statuses, pod IP) back to the API server via the node’s /status subresource.
- CRI interface: Talks to the container runtime (containerd, CRIO) using the Container Runtime Interface, making the kubelet runtimeagnostic.

## 4.2 kubeproxy

- Runs on each node. Watches Services and Endpoints/EndpointSlices.
- Programs local network rules (iptables, IPVS, or userspace) so that traffic to a Service’s ClusterIP is loadbalanced across its healthy backend pods.
- When pods come and go, kubeproxy updates the rules to include new pods and exclude terminating ones. This ensures minimal disruption.

## 4.3 Container Runtime

- Pluggable via CRI. Pulls images, creates containers, manages the pod’s network/process isolation. The runtime is simply a lowlevel executor; all intelligence lives in the kubelet.


## 5. The Controller Pattern and Declarative Reconciliation

Kubernetes’ power comes from the controller pattern:
Declare desired state (e.g., “I want 5 replicas of image v2 with a rolling update strategy”).
Controllers observe actual state and drive toward desired state.
- They never issue direct commands like “start container X”; they only manipulate API objects (ReplicaSets, Pods), which other controllers then act on.
This is analogous to a thermostat: you set a temperature, and it turns the heater on/off until the sensor matches the set point. No direct instruction to “heat for 10 seconds” ever exists.
Why leveltriggered? If a component restarts, it relists all objects and reconciles from scratch. No state is lost. This makes the system selfhealing and robust to failures.


## 6. LowLevel Walkthrough: A Deployment Rolling Update

Assume we have a Deployment myapp with replicas: 5, strategy RollingUpdate, maxUnavailable: 1, maxSurge: 1. The current ReplicaSet myapp-7f4c5d8b9c (RSold) maintains 5 pods running image v1. The user updates the Deployment to use image v2.
Step 1: User Applies the Change
kubectl apply sends a PUT/PATCH to the API server.
API server authenticates, authorises, passes admission, validates, and writes the updated Deployment object to etcd. metadata.generation is incremented (spec change detected).
- A watch event notifies the Deployment controller.
Step 2: Deployment Controller Reconciles
The Deployment controller’s informer receives the event; key default/myapp enters the work queue.
- Reconciliation:
- Reads all ReplicaSets owned by this Deployment.
Desired state: 5 replicas, template with v2.
Sees no ReplicaSet with that template. Creates a new ReplicaSet (RS-new, say myapp-5d8b9c7f6b) with replicas: 0, matching selectors, and the v2 pod template. Owner reference links to the Deployment.
Updates status.observedGeneration to match metadata.generation.
Step 3: The Rollout Begins – Scaling Up the New RS
Rolling update constraints: total pod ceiling = replicas + maxSurge = 6. Unavailable allowed = maxUnavailable = 1.
- Old RS: 5 ready pods. New RS: 0.
- The Deployment controller calculates that it can create 1 new pod (since 5+1 ≤ 6).
It patches RSnew’s spec.replicas from 0 → 1.
Step 4: ReplicaSet Controller Creates the Pod
The ReplicaSet controller watches RSnew. It sees replicas=1 but only 0 pods.
It creates a Pod object with the v2 template, owner reference to RSnew, no nodeName. The pod is “Pending”.
Step 5: Scheduler Assigns a Node
- The scheduler watches unscheduled pods. It finds the new pod.
- Filter and score nodes; pick the best match.
Posts a Binding for that pod, setting nodeName.
- Pod phase becomes “Scheduled” (still Pending, now with a node).
Step 6: Kubelet Starts the Container
- The kubelet on the chosen node watches pods assigned to it. It sees the new pod.
- Creates the pause container (pod network namespace).
Pulls v2 image (if not cached).
- Starts the application container with the spec’s command, env, volumes.
Begins executing readiness probes. Until they succeed, the pod is NotReady.
- Updates pod status (phase, container statuses, IP) via the API server.
Step 7: Service Endpoints Update
When the pod becomes Ready (readiness probe passes), the Endpoints controller adds its IP to the Service’s Endpoints object.
kubeproxy on every node watches Endpoints and updates local iptables/IPVS rules to include the new backend. New traffic can already hit the new pod.
Step 8: Deployment Controller Observes Progress & Continues
- The Deployment controller watches the ReplicaSets’ status (ready replicas). It sees RSnew has 1 ready pod.
It can now scale down the old RS by 1 because maxUnavailable=1 is satisfied. It decrements RSold replicas from 5 → 4.
The ReplicaSet controller detects the excess pod and deletes one from RSold (choosing any pod; it respects termination grace period). That pod enters Terminating, its container is stopped, and it is removed.
- Iteration continues: old RS 4, new RS 1 → scale new RS to 2 → old RS to 3 → new RS to 3 → … until old RS reaches 0 and new RS reaches 5.
The deployment’s status updates with availableReplicas=5, progressing=false.
Step 9: Final State & Cleanup
The old RS is retained (controlled by revisionHistoryLimit) for rollback history.
The new RS now manages all 5 pods of v2.
- Rollout complete.
Concurrency & Failure Handling
Optimistic locking: Every write includes resourceVersion; if two controllers modify the same object, one gets a conflict and retries.
Progress deadline: If the new RS fails to progress within progressDeadlineSeconds, the rollout is marked as failed. The controller does not automatically rollback (but external tools can).
Readiness gates: The rollout never terminates an old pod until the new one is ready, preserving service availability within maxUnavailable limits.


## 7. Senior Engineer’s Synthesis – The “Why” Behind the “How”

- Vendor neutrality: The control plane’s abstraction over cloud APIs means we don’t fight providerspecific wiring when migrating or running hybrid. This is a direct answer to the lockin pain of ECS/CloudFormation.
Declarative > imperative: By specifying only desired state, we avoid fragile scripts that break under transient failures. The controller pattern selfheals.
- Eventual consistency with watch: No polling means nearinstant reaction without wasting resources.
- Separate concerns: Scheduler doesn’t start containers; kubelet doesn’t decide where pods go. Each component is testable, swappable, and scalable.
Rolling update safety: maxSurge + maxUnavailable + readiness probes guarantee zerodowntime, capacityaware updates. Even if a new version fails health checks, the rollout pauses, preserving the old stable pods.
- Scale at zero cost: Because the controllers are leveltriggered, adding a new node or a new ReplicaSet is just another event in the queue – no linear increase in controlplane load.
This combination of historical context and internal mechanics is what separates a junior who “knows kubectl” from a senior engineer who can reason about failure modes, scalability, and why Kubernetes behaves the way it does.
Kubernetes from the Ground Up: A Senior Engineer’s Deep Dive2nd -Part Kubernetes Architecture in Motion & the Cloud Abstraction Layer — Senior Engineer’s Deep Dive

This note continues the deep technical breakdown from Part 1. We now walk through the exact sequence of a simple podlaunch and scaleout, then examine how Kubernetes solves the vendorlockin problem through the Cloud Controller Manager.


## 8. Architecture in Action: From kubectl to a Running Container


## 8.1 The Physical Layout

You start with at least two classes of machines:
Role
Components
Control Plane node(s)
kube-apiserver, etcd, kube-controller-manager, kube-scheduler
Worker node(s)
kubelet, kube-proxy, container runtime (containerd, CRIO)
The control plane is the administration brain; worker nodes are the muscle that actually run workloads (containers).

## 8.2 Stepbystep: Launching Two Nginx Containers (simplified as Pods)

Assume a user tells the cluster: “I want two nginx containers.” In Kubernetes, that usually means two Pods, each possibly with an nginx container.
User submits intentkubectl run nginx --image=nginx --replicas=2 or a Deployment manifest. The command is sent to the API server over HTTPS.
The API server authenticates the user (certs, tokens) and authorises the action via RBAC.
The request passes through admission controllers, then is written to etcd as a new Deployment or ReplicaSet object (desired state: 2 replicas).
Controller manager reactsThe Deployment controller sees the new Deployment and creates a ReplicaSet. The ReplicaSet controller then watches that ReplicaSet.
It reads spec.replicas: 2, observes status.readyReplicas: 0.
It creates two Pod objects (with the nginx container template) in the API server. These Pods initially have no nodeName — they are “Pending” and unscheduled.
Scheduler assigns Pods to nodesThe kube-scheduler watches for Pods with an empty nodeName.
For each unscheduled Pod, it runs its filtering (nodes with enough CPU/memory, matching taints, etc.) and scoring algorithms.
It chooses the best node and writes a Binding object (a subresource of the Pod), setting nodeName. The Pod is now “Scheduled” to a specific worker.
Kubelet starts the containersThe kubelet on that worker node watches Pods assigned to its hostname.
It detects the new Pod and enters the sync loop:
- Create the pod’s network namespace (pause container).
Pull the nginx image via the Container Runtime Interface (CRI).
- Start the nginx container with the specified command, env vars, volumes.
The kubelet continuously runs liveness/readiness probes and reports the Pod’s condition back to the API server (/status subresource).
- Once readiness passes, the Pod is marked “Ready” and its IP is added to any matching Service’s endpoints.
Networkingkube-proxy watches Endpoint updates and programs local iptables/IPVS rules so traffic to the Service’s ClusterIP reaches the Pod. External access, if configured, is handled by a Service of type LoadBalancer or NodePort.

## 8.3 ScaleOut / SelfHealing in Action

The entire system is built on desiredstate reconciliation:
- Scenario: You scale from 2 to 5 replicas (kubectl scale --replicas=5 ...).
The API server updates the ReplicaSet’s spec.replicas to 5 in etcd.
The ReplicaSet controller sees current = 2, desired = 5 → creates 3 additional Pods.
- The scheduler assigns them; kubelets start the containers.
- Scenario: A node crashes, taking 2 Pods with it.
The node controller marks the node as NotReady.
The ReplicaSet controller sees current < desired, creates 2 replacement Pods.
- The scheduler places them on healthy nodes.
Key insight: The API server and etcd hold only the intent (desired state) and observed status. The controllers continuously watch for drift and close the gap — no direct “start pod” command is sent from the scheduler; it’s all orchestrated through API object mutations.


## 9. Desired State Reconciliation — The Heart of Kubernetes

State store: etcd is the single source of truth. Objects have a spec (what you want) and a status (what is actually happening).
- Reconciliation loop: Every controller runs a loop:
- Read the object’s spec and the current observed state (from caches).
- Compute the difference.
- Take actions to drive current → desired (create, update, delete API objects).
- Repeat on next event or resync interval.
- Faulttolerant: If a controller crashes, the new instance relists objects and reconciles from scratch. No lost state because the desired state is persisted in etcd.
- Why no imperative commands: You never say “start container X”; you declare “I need 5 replicas”. This is why the system selfheals — if a container dies, the current count drops, and the controller automatically brings it back.
This is exactly why Kubernetes restarts crashed pods without human intervention — the control loop doesn’t care why a pod disappeared; it only sees that current replicas < desired.


## 10. The Cloud Controller Manager: Abstracting the Provider


## 10.1 The Vendor Lockin Problem

Recall that AWS has its own load balancer (ELB), DigitalOcean has its own, GCP its own. If the core Kubernetes tried to create a load balancer directly, the code would be littered with cloudspecific logic. That would:
- Force Kubernetes to ship with every provider’s SDK.
- Break portability — a manifest written for AWS wouldn’t work on bare metal or GCP without changes.
Create a lockin: your operational tooling and configurations would be wedded to one cloud.

## 10.2 How CCM Solves It

Kubernetes introduces a separate component called the Cloud Controller Manager (CCM). It runs cloudspecific controllers that implement a common interface. The core Kubernetes knows nothing about the underlying infrastructure.

## 10.2.1 Architecture

- The CCM is a binary that communicates with the API server just like any other controller.
- It contains multiple controllers:
- Node controller: monitors cloud provider’s VM lifecycle; deletes Kubernetes node objects when the VM is terminated.
- Route controller: configures cloud routes for pod networking (if the cloud uses VPC route tables).
Service controller: watches for Services of type LoadBalancer and calls the cloud API to provision a real load balancer, updating the Service’s status with the external IP/hostname.

## 10.2.2 Flow: Creating a Cloud Load Balancer

User creates a Service with type: LoadBalancer.
The Service controller (part of cloudcontrollermanager) sees the new Service.
It calls the cloud provider’s API (e.g., AWS CreateLoadBalancer) with the necessary ports, health checks, etc.
Once provisioned, it writes the load balancer’s public DNS/IP back into the Service’s status.loadBalancer field.
All of this is declarative — the user merely requests a load balancer; the CCM handles the cloudspecific instantiation.

## 10.2.3 ProviderSpecific Manifests Become Unnecessary

Because the CCM abstracts the cloud, the same Service YAML works on any Kubernetes cluster — whether it’s on AWS, GCP, Azure, or a baremetal deployment with a custom loadbalancer solution (like MetalLB). The core cluster remains vendoragnostic.

## 10.3 Why This Matters for Senior Engineers

- Separation of concerns: The core orchestration logic (scheduling, scaling, selfhealing) stays pure. Cloudspecific integrations are cleanly isolated.
- Extensibility: You can write your own CCM for a custom private cloud.
- No lockin: Your deployment and service definitions never contain providerspecific magic strings. Switch providers by changing only the CCM and possibly storage classes — the application manifests remain identical.


## 11. Bringing It All Together — The Full Picture

Developer declares intent (Deployment, Service) → hits the API server.
API server persists desired state in etcd.
Controllers (Deployment, ReplicaSet) calculate deltas and create/update Pod objects.
Scheduler assigns Pods to the best nodes.
Kubelet on the chosen node translates Pod spec into running containers via the CRI.
kube-proxy wires up network rules so traffic reaches the pods.
CCM (if needed) provisions cloudspecific resources like load balancers, keeping the core generic.
All of this runs as a leveltriggered, eventuallyconsistent reconciliation loop — any failure is automatically corrected by the next sync.
This layered, pluggable architecture is what enables Kubernetes to scale from a singlenode test cluster to a 15,000node production fleet, all while running the same application definitions across any infrastructure.
The first part of this note covered the historical context, deep component internals, and a lowlevel walkthrough of a rolling update. This second part completes the story by showing how those components interact in a simple pod launch, how scaling and selfhealing flow from desired state, and how the Cloud Controller Manager preserves vendor neutrality — giving you the full mental model of a senior Kubernetes engineer.
