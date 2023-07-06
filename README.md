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
docker run command = `docker run --gpus all -d stable-diffusion-crai-v01`
