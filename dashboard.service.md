# 1.上传到/home/user之后执行
sudo mv /home/user/hyx/dashboard.service /etc/systemd/system/

# 2.重新加载systemd
sudo systemctl daemon-reload
# 3.启动服务
sudo systemctl start dashboard
# 4.查看状态
sudo systemctl status dashboard
# 5.设置开机自启（可选）
sudo systemctl enable dashboard