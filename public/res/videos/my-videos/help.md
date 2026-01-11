ffmpeg -y -f lavfi -i "color=c=#05070c:s=1024x1024:d=6,format=rgba" -f lavfi -i "life=s=1024x1024:ratio=0.15:death_color=#00aaff:life_color=#00ffff:seed=42" -filter_complex "[0][1]overlay=shortest=1,format=rgba,noise=alls=20:allf=t,drawgrid=w=64:h=64:t=1:c=#00baff@0.35,eq=brightness=0.02:saturation=1.2" -r 30 -pix_fmt yuv420p tech_loop.mp4


