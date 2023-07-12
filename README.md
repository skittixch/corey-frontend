# corey

This is a project made with love for my best friend Corey who left this earth on April 15th, 2023 at the age of 36. Motherfucker.

# building this yourself
To build this yourself on a new machine... First, let's assume you're me, and have an NVIDIA graphics card, otherwise, idfk. AMD is supported, but you'll have to look around.

First, install wsl ubuntu on your host system (in my case, a windows 11 insider preview build).
Then grab the nvidia [container toolkit](https://github.com/NVIDIA/nvidia-docker) from [docker hub](https://hub.docker.com/r/nvidia/cuda) and install that inside WSL ubuntu.
Check and see if it's working by typing nvidia-smi in your command prompt.

Finally, you need an nvidia supplied base image. I went with Cuda 11.0.3 and ubuntu 20.04. once you find one you like, you'll "pull" it to download it to your system for use in the docker engine

to pull the base image, run this
`docker pull nvidia/cuda:11.0.3-base-ubuntu20.04`
if you pull a more recent one, it'll install a later version of Python that makes the installation fail.

docker run command = `docker run --gpus all -d -p 7860:7860 stable-diffusion-crai-v01`

Dockerfile
```
FROM nvidia/cuda:11.0.3-base-ubuntu20.04
ENV DEBIAN_FRONTEND=noninteractive
RUN apt update
RUN apt install -y python3-pip python3 python-is-python3 git-all
WORKDIR /usr/src/app
COPY . .
CMD nvidia-smi \
    && python --version \
    && python launch.py --listen --api
ENV LISTEN 7860
EXPOSE 7860
```
`docker build -t stable-diffusion-crai-v01 . `

## To Do: 
-investigate sveltekit to overcome cors errors!
- make connection automatically on container run. Include the ssh remote tunnel in the crai container. use compose and secrets for the private key.
For now, run "remoteproxy.bat" in shell:startup

~~- get ai.ericbacus.com subdomain working. I've got a virtualhost set up in apache2, but the way it's forwarding the websockets traffic, it's throwing errors.~~

- according to a (Reddit comment)[https://www.reddit.com/r/sveltejs/comments/v8owzc/comment/ibruetp/?utm_source=share&utm_medium=mweb3x&utm_name=mweb3xcss&utm_term=1&utm_content=share_button], 
I could use this technique to pull the intermediate images while they're being generated. I think this would really add some wow factor. Apparently, in sveltekit, I should use a server-side script tag to read the contents of the folder and send one as a prop to the page when it gets loaded.

- figure out if I can just use DNS from digitalocean, or if I have to stick with dnsmadeeasy. figure this out in the next week or 2 since it renews on the 22nd
