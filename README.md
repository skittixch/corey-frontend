# corey

~I need to update my server to Debian 9 at least. I'm making a snapshot on digitalocean now. later will upgrade. That'll allow me to use let's encrypt to get https working.~ Done!

good lord. ok, I (think I) just figured out how to get cuda to run on a docker container of stable diffusion. it's late and i have to go to bed before I go any further, but here's what I did.

first install wsl ubuntu on your host system (in my case, a windows 11 insider preview build).
then grab the nvidia container toolkit.
make sure you can run nvidia-smi in your command prompt, and in your wsl prompt
finally, this is the secret sauce
run this
`docker pull nvidia/cuda:11.0.3-base-ubuntu20.04`
then make your Dockerfile 
`FROM nvidia/cuda:11.0.3-base-ubuntu20.04`
`CMD nvidia-smi`
docker run command = `docker run --gpus all -d -p 7860:7860 stable-diffusion-crai-v01`

## Docker

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

To Do: include the ssh remote tunnel in the crai container. use compose and secrets for the private key.
For now, run "remotePorxy" in shell:startup
