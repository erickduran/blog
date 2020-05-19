---
layout: post
title: 'Distroless: a first step into securing Docker'
tags: [Docker, Security, DevSecOps, Distroless, DevOps]
category: Programming
comments: true
---

Docker came as great and easy solution to overcome many problems, such as dependencies, isolation, agility, etc. However, time passes and it becomes more and more common to find developers blindly including vulnerable dependencies that they might even not be using. Distroless can be the first step to solve that.

With all of its advantages, Docker also makes it easy to be lazy. Most images usually start like this:
```Dockerfile
FROM python:3.7-stretch # or another cool (hopefully official) image

COPY my-app.py .

RUN apt-get update \
    && apt-get install -qqy \
    nice-dependency-1 \
    nice-dependency-2 
    # ... and probably a bunch of dependencies that just make it work

CMD ["python", "my-app.py"]
```

And that's great. You might get really happy when your code compiles and runs with all its dependencies after less than 10 attempts, but it isn't that exciting when your corporate network gets breached because a recent RCE (Remote Code Execution) vulnerability was disclosed for `python:3.7-stretch` or your `nice-dependency-1`.

[According to Snyk](https://snyk.io/blog/the-top-two-most-popular-docker-base-images-each-have-over-500-vulnerabilities/), on 2019, the official Node.js image included more than 500 vulnerable system libraries and, on top of that, half of developers don't even perform any kind of security scan on the OS layer of their images. There is almost no testing or scanning done on the underlying layers of production applications running in Docker.

But, **is it worth securing isolated environments?** In 2019, a serious [vulnerability](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2019-5736) was disclosed in runC (a container runtime) that allowed an attacker to overwrite the tool's binary and potentially gain access to the host, provided that the user had write access to a container. Even [AWS services were affected](https://aws.amazon.com/security/security-bulletins/AWS-2019-002/). This is just one of many severe issues that have been reported in relation with Docker.

## So, what is distroless?
> Distroless images are *exactly* what you need.

Distroless images are **exactly** what your application needs to run. Just your code with any necessary dependencies. Nothing else, no shell, no `cp`, no `cat`, no `touch`, etc. They include the bare minimum to run the OS, your language runtime and your application with its dependencies.

Distroless is project introduced [by Google](https://github.com/GoogleContainerTools/distroless) to develop smaller and more secure Docker images having the premise that most of what common images include is not really necessary.

By having a distroless base image, you force yourself into precisely knowing what files or dependencies your application needs to execute. You also enforce a build step that can be extracted from the runtime so you just have to copy the final executable file(s) to your runtime environment. There is no package managers, so the risk of letting an attacker install something after they have gained access to your container is removed, at least by installing it that way.

Additionally, this may also come with the great side effect of reducing your overall image size. Depending on the image you choose to use and your application's dependencies, you may save a lot of space. Less system libraries and simpler OS also means less storage.

## Is it safer?
I recently worked on [this small Proof of Concept](https://github.com/erickduran/docker-distroless-poc) to experiment with distroless and understand its advantages against RCE. The experiment consists of a vulnerable web application that was built on a distroless image and a regular image for comparison. The web application allowed the user to ping any host without sanitizing the input, allowing the user to inject any extra commands to the text field. This could easily be leveraged by an attacker to use some tool like `curl` or `wget` to download an exploit and potentially obtain a reverse shell. 

At the end, I was not able to do much by attempting to execute commands in the vulnerable distroless application and it certainly provided less feedback than the "regular" version, making the exploration stage of an attack harder. There was some RCE happening, but as all commands returned "not found" there was virtually nothing you could do or any information to obtain. If by some reason an attacker manages to get a shell, there's not much they can do as it is nearly impossible to do anything interesting with the included set of OS commands or downloading any additional tools.

The images compared in size by almost the double. The original application based on the `python:3.7-slim-stretch` image was 185MB and the distroless version was 71MB. 

## As a developer, what can I do to start securing my images?
You can start by asking yourself these questions:
- Do you test your Docker images (not just your code)?
- Do you scan your Docker images for vulnerable dependencies?
- Do you pentest your final Docker containers in runtime?

From experimenting with distroless, I encountered that it is way easier to start setting up your environment the right way from the beginning. Google uses [Bazel](https://bazel.build/) to build the images and properly test them before pushing them to their registries. You can adopt these practices to at least address the first two questions from above. The third can be achieved on the test stage by getting a [DAST](https://en.wikipedia.org/wiki/Dynamic_application_security_testing) tool.

## Final comments
If you want to create and deliver secure containerized production applications, you should take give a chance to distroless images. Some of the advantages include, but are not limited to:
- Controlled use of dependencies
- Complete awareness of your environment
- Overall image size reduction
- Mitigating the risk of exposing a shell
- Avoiding package managers and associated risks

Migrating your whole workflow to this paradigm may take some time (specially for big, legacy projects with lots of dependencies), but it is definetly worth a try if you haven't taken a first step to reduce the risks included with Docker.

## Other resources

- This [awesome post](https://snyk.io/blog/10-docker-image-security-best-practices/) (by Liran Tal and Omer Levi Hevroni) is worth a read for those looking for Docker's best practices with examples.
- [Google's distroless talk](https://www.youtube.com/watch?v=lviLZFciDv4).
- Another [post](https://www.abhaybhargav.com/stories-of-my-experiments-with-distroless-containers/) with distroless experiments.

