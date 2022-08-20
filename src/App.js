import React, { useState } from "react";
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import InputLabel from '@mui/material/InputLabel';
import MuiAccordion from '@mui/material/Accordion';
import MuiAccordionSummary from '@mui/material/AccordionSummary';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import CircularProgress from '@mui/material/CircularProgress';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import AWS from 'aws-sdk';
import ServiceQuotas from "aws-sdk/clients/servicequotas";

import "./App.css"
import Shizuku from "./title-shizuku.webp"

//Need Further Investigation
//var ProxyAgent = require('proxy-agent');
var ProxyAgent //This is a placeholder

//Accordion Style
const Accordion = styled((props) => (
  <MuiAccordion disableGutters elevation={0} square {...props} />
))(({ theme }) => ({
  border: 0
}));

const AccordionSummary = styled((props) => (
  <MuiAccordionSummary
    expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
    {...props}
  />
))(({ theme }) => ({
  backgroundColor: 'rgba(0, 0, 0, 0)',
  flexDirection: 'row-reverse',
  '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
    transform: 'rotate(90deg)',
  },
  '& .MuiAccordionSummary-content': {
    marginLeft: theme.spacing(1),
  },
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
  padding: theme.spacing(2),
  borderTop: '1px solid rgba(0, 0, 0, .125)',
}));

function App() {
  const defaultRemote = process.env.REACT_APP_DEFAULT_REMOTE_DOMAIN;

  const regions = ["us-east-2", "us-east-1", "us-west-1", "us-west-2", "af-south-1", "ap-east-1", "ap-southeast-3", "ap-south-1", "ap-northeast-3", "ap-northeast-2", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ca-central-1", "eu-central-1", "eu-west-1", "eu-west-2", "eu-south-1", "eu-west-3", "eu-north-1", "me-south-1", "sa-east-1"]
  const systems = ["Debian 10", "Debian 11", "Ubuntu 20.04", "Ubuntu 22.04", "Arch Linux"]
  const types = ["t2.micro", "t3.micro", "c5n.large", "t3a.micro", "t2.2xlarge", "t2.xlarge", "t2.large", "t2.medium", "t2.nano", "t3.nano", "t3.small", "t3.medium", "t3.large", "t3.xlarge", "t3.2xlarge", "t3a.nano", "t3a.small", "t3a.medium", "t3a.large", "t3a.xlarge", "t3a.2xlarge", "c5n.xlarge", "c5n.4xlarge", "c5n.2xlarge", "c5.xlarge", "c5.2xlarge", "c5.4xlarge", "c5a.large", "c5a.xlarge", "c5a.2xlarge"]
  const regionsDetail = ["US East (Ohio)", "US East (N. Virginia)", "US West (N. California)", "US West (Oregon)", "Africa (Cape Town)", "Asia Pacific (Hong Kong)", "Asia Pacific (Jakarta)", "Asia Pacific (Mumbai)", "Asia Pacific (Osaka)", "Asia Pacific (Seoul)", "Asia Pacific (Singapore)", "Asia Pacific (Sydney)", "Asia Pacific (Tokyo)", "Canada (Central)", "Europe (Frankfurt)", "Europe (Ireland)", "Europe (London)", "Europe (Milan)", "Europe (Paris)", "Europe (Stockholm)", "Middle East (Bahrain)", "South America (São Paulo)"]
  const states = new Map([[0, "正在启动"], [16, "正在运行"], [32, "正在关机"], [48, "已终止"], [64, "正在停止"], [80, "已停止"]]);

  const [aki, setAki] = useState("");
  const [saki, setSaki] = useState("");
  const [mode, setMode] = useState(1);
  const [remote, setRemote] = useState(defaultRemote);
  const [proxy, setProxy] = useState("");
  const [liRegion, setLiRegion] = useState("");
  const [system, setSystem] = useState("");
  const [type, setType] = useState("");
  const [password, setPassword] = useState("");
  const [gqRegion, setGqRegion] = useState("");
  const [ciRegion, setCiRegion] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState("");
  const [dialogDescription, setDialogDescription] = useState("");
  const [isLaunchingInstance, setIsLaunchingInstance] = useState(false);
  const [isGettingQuota, setIsGettingQuota] = useState(false);
  const [isCheckingInstances, setIsCheckingInstances] = useState(false);
  const [isCheckedInstances, setIsCheckedInstances] = useState(false);
  const [regionOfCheckedInstances, setRegionOfCheckedInstances] = useState("");
  const [idOfInstanceChangingIp, setIdOfInstanceChangingIp] = useState("");
  const [idOfInstanceTerminating, setIdOfInstanceTerminating] = useState("");
  const [instances, setInstances] = useState([]);

  //Interactions
  function showAlert(title, description) {
    setDialogOpen(true);
    setDialogTitle(title);
    setDialogDescription(description);
  }

  //Validations
  function validateRemote() {
    var validRemoteTemplate = /^(http|https?:\/\/)/;
    return validRemoteTemplate.test(remote);
  }

  function validateProxy() {
    var validProxyTemplate = /^(http|https|socks|socks(4|5)|pac?:\/\/)/;
    return validProxyTemplate.test(proxy);
  }

  //Operations
  function launchInstance() {
    setIsLaunchingInstance(true);
    if (aki.length !== 20 || saki.length !== 40) {
      showAlert("无效凭证", "请检查凭证格式是否正确");
      setIsLaunchingInstance(false);
      return;
    }
    if (liRegion === "") {
      showAlert("选择地区", "请选择地区后再试一次");
      setIsLaunchingInstance(false);
      return;
    }
    if (system === "") {
      showAlert("选择操作系统", "请选择操作系统后再试一次");
      setIsLaunchingInstance(false);
      return;
    }
    if (type === "") {
      showAlert("选择实例类型", "请选择实例类型后再试一次");
      setIsLaunchingInstance(false);
      return;
    }
    if (password.length < 6) {
      showAlert("无效密码", "请输入6位以上密码后再试一次");
      setIsLaunchingInstance(false);
      return;
    }
    if ((mode === 2 || mode === 3 || mode === 4) && !validateRemote()) {
      showAlert("无效远端地址", "远端地址格式不正确，请修改后再试一次");
      setIsLaunchingInstance(false);
      return;
    }
    if ((mode === 3 || mode === 4) && !validateProxy()) {
      showAlert("无效代理地址", "代理地址格式不正确，请修改后再试一次");
      setIsLaunchingInstance(false);
      return;
    }
    if (mode === 1 || mode === 3) {
      AWS.config = new AWS.Config();
      AWS.config.update(
        {
          accessKeyId: aki,
          secretAccessKey: saki,
          region: liRegion
        }
      );
      if (mode === 3) {
        AWS.config.update({
          httpOptions: { agent: ProxyAgent(proxy) }
        });
      }
      var ec2 = new AWS.EC2();
      var imageName = ''
      var imageOwner = ''
      var imageId = ''
      if (system === 'Debian 10') {
        imageName = 'debian-10-amd64-2022*'
        imageOwner = '136693071363'
      }
      if (system === 'Debian 11') {
        imageName = 'debian-11-amd64-2022*'
        imageOwner = '136693071363'
      }
      if (system === 'Ubuntu 20.04') {
        imageName = 'ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-2022*'
        imageOwner = '099720109477'
      }
      if (system === 'Ubuntu 22.04') {
        imageName = 'ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-2022*'
        imageOwner = '099720109477'
      }
      if (system === 'Arch Linux') {
        imageName = '*'
        imageOwner = '647457786197'
      }
      var imageParams = {
        Filters: [
          {
            Name: 'name',
            Values: [
              imageName
            ]
          },
          {
            Name: 'architecture',
            Values: [
              'x86_64'
            ]
          }
        ],
        Owners: [
          imageOwner
        ]
      }
      ec2.describeImages(imageParams, function (err, data) {
        if (err) {
          showAlert("启动实例失败：" + err.name, "错误：" + err.message + "，请再试一次或联系支持");
          setIsLaunchingInstance(false);
        }
        else {
          imageId = data.Images[0].ImageId
          var keyName = String(Date.now())
          var keyParams = {
            KeyName: keyName
          };
          ec2.createKeyPair(keyParams, function (err, data) {
            if (err) {
              showAlert("启动实例失败：" + err.name, "错误：" + err.message + "，请再试一次或联系支持");
              setIsLaunchingInstance(false);
            } else {
              var sgParams = {
                Description: keyName,
                GroupName: keyName
              }
              ec2.createSecurityGroup(sgParams, function (err, data) {
                if (err) {
                  showAlert("启动实例失败：" + err.name, "错误：" + err.message + "，请再试一次或联系支持");
                  setIsLaunchingInstance(false);
                } else {
                  var groupId = data.GroupId
                  var asgParams = {
                    GroupId: groupId,
                    IpPermissions: [
                      {
                        FromPort: 0,
                        IpProtocol: "tcp",
                        IpRanges: [
                          {
                            CidrIp: "0.0.0.0/0",
                            Description: "All TCP"
                          }
                        ],
                        ToPort: 65535
                      },
                      {
                        FromPort: 0,
                        IpProtocol: "udp",
                        IpRanges: [
                          {
                            CidrIp: "0.0.0.0/0",
                            Description: "All UDP"
                          }
                        ],
                        ToPort: 65535
                      },
                      {
                        FromPort: -1,
                        IpProtocol: "icmp",
                        IpRanges: [
                          {
                            CidrIp: "0.0.0.0/0",
                            Description: "All ICMP"
                          }
                        ],
                        ToPort: -1
                      },
                      {
                        FromPort: -1,
                        IpProtocol: "icmpv6",
                        IpRanges: [
                          {
                            CidrIp: "0.0.0.0/0",
                            Description: "All ICMPV6"
                          }
                        ],
                        ToPort: -1
                      }
                    ]
                  };
                  ec2.authorizeSecurityGroupIngress(asgParams, function (err, data) {
                    if (err) {
                      showAlert("启动实例失败：" + err.name, "错误：" + err.message + "，请再试一次或联系支持");
                      setIsLaunchingInstance(false);
                    } else {
                      var userDataRaw = "#!/bin/bash\necho root:" + password + "|sudo chpasswd root\nsudo rm -rf /etc/ssh/sshd_config\nsudo tee /etc/ssh/sshd_config <<EOF\nClientAliveInterval 120\nSubsystem       sftp    /usr/lib/openssh/sftp-server\nX11Forwarding yes\nPrintMotd no\nChallengeResponseAuthentication no\nPasswordAuthentication yes\nPermitRootLogin yes\nUsePAM yes\nAcceptEnv LANG LC_*\nEOF\nsudo systemctl restart sshd\n"
                      var userData = btoa(userDataRaw)
                      var instanceParams = {
                        ImageId: imageId,
                        InstanceType: type,
                        KeyName: keyName,
                        MinCount: 1,
                        MaxCount: 1,
                        SecurityGroupIds: [
                          groupId
                        ],
                        UserData: userData
                      };
                      ec2.runInstances(instanceParams, function (err, data) {
                        if (err) {
                          showAlert("启动实例失败：" + err.name, "错误：" + err.message + "，请再试一次或联系支持");
                          setIsLaunchingInstance(false);
                        } else {
                          showAlert("启动实例成功", "您的新实例id为" + data.Instances[0].InstanceId + "，请30秒后通过查询实例详细信息获得公网ip，在此期间您可以开启另一个实例或进行其他操作");
                          setIsLaunchingInstance(false);
                          setInstances([]);
                          checkInstances(true);
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
    else if (mode === 2 || mode === 4) {
      var liPostBody
      if (mode === 2) {
        liPostBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: liRegion,
          system: system,
          type: type,
          password: password,
          useProxy: false
        })
      }
      else if (mode === 4) {
        liPostBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: liRegion,
          system: system,
          type: type,
          password: password,
          useProxy: true,
          proxy: proxy
        })
      }
      fetch(remote + '/aws-launch-instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: liPostBody
      })
        .then(async (response) => {
          var body = await response.json();
          if (response.ok) {
            showAlert("启动实例成功", "您的新实例id为" + body.instanceId + "，请30秒后通过查询实例详细信息获得公网ip，在此期间您可以开启另一个实例或进行其他操作");
            setIsLaunchingInstance(false);
            setInstances([]);
            checkInstances(true);
          }
          else {
            showAlert("启动实例失败：" + body.error.name, "错误：" + body.error.message + "，请再试一次或联系支持");
            setIsLaunchingInstance(false);
          }
        });
    }
  }

  function getQuota() {
    setIsGettingQuota(true);
    if (aki.length !== 20 || saki.length !== 40) {
      showAlert("无效凭证", "请检查凭证格式是否正确");
      setIsGettingQuota(false);
      return;
    }
    if (gqRegion === "") {
      showAlert("选择地区", "请选择地区后再试一次");
      setIsGettingQuota(false);
      return;
    }
    if ((mode === 2 || mode === 3 || mode === 4) && !validateRemote()) {
      showAlert("无效远端地址", "远端地址格式不正确，请修改后再试一次");
      setIsGettingQuota(false);
      return;
    }
    if ((mode === 3 || mode === 4) && !validateProxy()) {
      showAlert("无效代理地址", "代理地址格式不正确，请修改后再试一次");
      setIsGettingQuota(false);
      return;
    }
    if (mode === 1 || mode === 3) {
      AWS.config = new AWS.Config();
      AWS.config.update(
        {
          accessKeyId: aki,
          secretAccessKey: saki,
          region: gqRegion
        }
      );
      if (mode === 3) {
        AWS.config.update({
          httpOptions: { agent: ProxyAgent(proxy) }
        });
      }
      var servicequotas = new AWS.ServiceQuotas();
      var params = {
        QuotaCode: 'L-1216C47A',
        ServiceCode: 'ec2'
      };
      servicequotas.getServiceQuota(params, function (err, data) {
        if (err) {
          showAlert("查看配额失败：" + err.name, "错误：" + err.message + "，请再试一次或联系支持");
          setIsGettingQuota(false);
        }
        else {
          showAlert("查看配额成功", "您在该区域的配额为" + String(data.Quota.Value));
          setIsGettingQuota(false);
        }
      });
    }
    else if (mode === 2 || mode === 4) {
      var gqPostBody
      if (mode === 2) {
        gqPostBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: gqRegion,
          useProxy: false
        })
      }
      else if (mode === 4) {
        gqPostBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: gqRegion,
          useProxy: true,
          proxy: proxy
        })
      }
      fetch(remote + '/aws-get-quota', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: gqPostBody
      })
        .then(async (response) => {
          var body = await response.json();
          if (response.ok) {
            showAlert("查看配额成功", "您在该区域的配额为" + String(body.quota));
            setIsGettingQuota(false);
          }
          else {
            showAlert("查看配额失败：" + body.error.name, "错误：" + body.error.message + "，请再试一次或联系支持");
            setIsGettingQuota(false);
          }
        });
    }
  }

  function checkInstances(noSuccessAlert) {
    setIsCheckingInstances(true);
    setIsCheckedInstances(false);
    setRegionOfCheckedInstances("");
    if (aki.length !== 20 || saki.length !== 40) {
      showAlert("无效凭证", "请检查凭证格式是否正确");
      setIsCheckingInstances(false);
      return;
    }
    if (ciRegion === "") {
      showAlert("选择地区", "请选择地区后再试一次");
      setIsCheckingInstances(false);
      return;
    }
    if ((mode === 2 || mode === 3 || mode === 4) && !validateRemote()) {
      showAlert("无效远端地址", "远端地址格式不正确，请修改后再试一次");
      setIsCheckingInstances(false);
      return;
    }
    if ((mode === 3 || mode === 4) && !validateProxy()) {
      showAlert("无效代理地址", "代理地址格式不正确，请修改后再试一次");
      setIsCheckingInstances(false);
      return;
    }
    if (mode === 1 || mode === 3) {
      AWS.config = new AWS.Config();
      AWS.config.update(
        {
          accessKeyId: aki,
          secretAccessKey: saki,
          region: ciRegion
        }
      );
      if (mode === 3) {
        AWS.config.update({
          httpOptions: { agent: ProxyAgent(proxy) }
        });
      }
      var ec2 = new AWS.EC2();
      var params = {}
      ec2.describeInstances(params, function (err, data) {
        if (err) {
          showAlert("查看实例详细信息失败：" + err.name, "错误：" + err.message + " 请再试一次或联系支持");
          setIsCheckingInstances(false);
        }
        else {
          var processedInstances = []
          data.Reservations.forEach(reservation => {
            reservation.Instances.forEach(instance => {
              processedInstances.push({ id: instance.InstanceId, state: instance.State.Code, type: instance.InstanceType, ip: instance.PublicIpAddress, platform: instance.PlatformDetails })
            })
          })
          setInstances(processedInstances);
          if (!noSuccessAlert) {
            showAlert("查看实例详细信息成功", "请在查看实例详细信息选项卡中查看您在该区域的实例信息");
          }
          setIsCheckingInstances(false);
          setIsCheckedInstances(true);
          setRegionOfCheckedInstances(ciRegion);
        }
      });
    }
    else if (mode === 2 || mode === 4) {
      var ciPostBody
      if (mode === 2) {
        ciPostBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: ciRegion,
          useProxy: false
        })
      }
      else if (mode === 4) {
        ciPostBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: ciRegion,
          useProxy: true,
          proxy: proxy
        })
      }
      fetch(remote + '/aws-check-instances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: ciPostBody
      })
        .then(async (response) => {
          var body = await response.json();
          if (response.ok) {
            setInstances(body.instances);
            if (!noSuccessAlert) {
              showAlert("查看实例详细信息成功", "请在查看实例详细信息选项卡中查看您在该区域的实例信息");
            }
            setIsCheckingInstances(false);
            setIsCheckedInstances(true);
            setRegionOfCheckedInstances(ciRegion);
          }
          else {
            showAlert("查看实例详细信息失败：" + body.error.name, "错误：" + body.error.message + "，请再试一次或联系支持");
            setIsCheckingInstances(false);
          }
        });
    }
  }

  function changeInstanceIp(id) {
    setIdOfInstanceChangingIp(id);
    if (aki.length !== 20 || saki.length !== 40) {
      showAlert("无效凭证", "请检查凭证格式是否正确");
      setIdOfInstanceChangingIp("");
      return;
    }
    if ((mode === 2 || mode === 3 || mode === 4) && !validateRemote()) {
      showAlert("无效远端地址", "远端地址格式不正确，请修改后再试一次");
      setIdOfInstanceChangingIp("");
      return;
    }
    if ((mode === 3 || mode === 4) && !validateProxy()) {
      showAlert("无效代理地址", "代理地址格式不正确，请修改后再试一次");
      setIdOfInstanceChangingIp("");
      return;
    }
    if (mode === 1 || mode === 3) {
      AWS.config = new AWS.Config();
      AWS.config.update(
        {
          accessKeyId: aki,
          secretAccessKey: saki,
          region: regionOfCheckedInstances
        }
      );
      if (mode === 3) {
        AWS.config.update({
          httpOptions: { agent: ProxyAgent(proxy) }
        });
      }
      var ec2 = new AWS.EC2();
      var allocateParams = {
        Domain: "vpc"
      };
      ec2.allocateAddress(allocateParams, function (err, data) {
        if (err) {
          showAlert("更换实例ip失败：" + err.name, "错误：" + err.message + " 请再试一次或联系支持");
          setIdOfInstanceChangingIp("");
        }
        else {
          var newAllocationId = data.AllocationId;
          var associateParams = {
            AllocationId: newAllocationId,
            InstanceId: id,
          };
          ec2.associateAddress(associateParams, function (err, data) {
            if (err) {
              showAlert("更换实例ip失败：" + err.name, "错误：" + err.message + " 请再试一次或联系支持");
              setIdOfInstanceChangingIp("");
            }
            else {
              var disassociateParams = {
                AssociationId: data.AssociationId
              };
              ec2.disassociateAddress(disassociateParams, function (err, data) {
                if (err) {
                  showAlert("更换实例ip失败：" + err.name, "错误：" + err.message + " 请再试一次或联系支持");
                  setIdOfInstanceChangingIp("");
                }
                else {
                  var releaseParams = {
                    AllocationId: newAllocationId
                  };
                  ec2.releaseAddress(releaseParams, function (err, data) {
                    if (err) {
                      showAlert("更换实例ip失败：" + err.name, "错误：" + err.message + " 请再试一次或联系支持");
                      setIdOfInstanceChangingIp("");
                    }
                    else {
                      setIdOfInstanceChangingIp("");
                      showAlert("更换实例ip成功", "请等待实例详细信息重新加载");
                      checkInstances(true);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
    else if (mode === 2 || mode === 4) {
      var ciiPostBody
      if (mode === 2) {
        ciiPostBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: regionOfCheckedInstances,
          instanceId: id,
          useProxy: false
        })
      }
      else if (mode === 4) {
        ciiPostBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: regionOfCheckedInstances,
          instanceId: id,
          useProxy: true,
          proxy: proxy
        })
      }
      fetch(remote + '/aws-change-instance-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: ciiPostBody
      })
        .then(async (response) => {
          var body = await response.json();
          if (response.ok) {
            showAlert("更换实例ip成功", "请等待实例详细信息重新加载");
            setIdOfInstanceChangingIp("");
            checkInstances(true);
          }
          else {
            showAlert("更换实例ip失败：" + body.err.name, "错误：" + body.err.message + " 请再试一次或联系支持");
            setIdOfInstanceChangingIp("");
          }
        });
    }
  }

  function terminateInstance(id) {
    setIdOfInstanceTerminating(id);
    if (aki.length !== 20 || saki.length !== 40) {
      showAlert("无效凭证", "请检查凭证格式是否正确");
      setIdOfInstanceTerminating("");
      return;
    }
    if ((mode === 2 || mode === 3 || mode === 4) && !validateRemote()) {
      showAlert("无效远端地址", "远端地址格式不正确，请修改后再试一次");
      setIdOfInstanceTerminating("");
      return;
    }
    if ((mode === 3 || mode === 4) && !validateProxy()) {
      showAlert("无效代理地址", "代理地址格式不正确，请修改后再试一次");
      setIdOfInstanceTerminating("");
      return;
    }
    if (mode === 1 || mode === 3) {
      AWS.config = new AWS.Config();
      AWS.config.update(
        {
          accessKeyId: aki,
          secretAccessKey: saki,
          region: regionOfCheckedInstances
        }
      );
      if (mode === 3) {
        AWS.config.update({
          httpOptions: { agent: ProxyAgent(proxy) }
        });
      }
      var ec2 = new AWS.EC2();
      var params = {
        InstanceIds: [
          id
        ]
      };
      ec2.terminateInstances(params, function (err, data) {
        if (err) {
          showAlert("终止实例失败：" + err.name, "错误：" + err.message + "，请再试一次或联系支持");
          setIdOfInstanceTerminating("");
        }
        else {
          showAlert("终止实例成功", "请等待实例详细信息重新加载，实例将在不久后被删除，在此之前它会保留在列表一段时间");
          setIdOfInstanceTerminating("");
          checkInstances(true);
        }
      });
    }
    else if (mode === 2 || mode === 4) {
      var tiPostBody
      if (mode === 2) {
        tiPostBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: regionOfCheckedInstances,
          instanceId: id,
          useProxy: false
        })
      }
      else if (mode === 4) {
        tiPostBody = JSON.stringify({
          aki: aki,
          saki: saki,
          region: regionOfCheckedInstances,
          instanceId: id,
          useProxy: true,
          proxy: proxy
        })
      }
      fetch(remote + '/aws-terminate-instance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: tiPostBody
      })
        .then(async (response) => {
          var body = await response.json();
          if (response.ok) {
            showAlert("终止实例成功", "实例将在不久后被删除，在此之前它会保留在列表一段时间");
            setIdOfInstanceTerminating("");
            checkInstances(true);
          }
          else {
            showAlert("终止实例失败：" + body.err.name, "错误：" + body.err.message + "，请再试一次或联系支持");
            setIdOfInstanceTerminating("");
          }
        });
    }
  }

  return (
    <div className="App">
      <Typography id="main-title" sx={{ m: 2 }} variant="h4">幻想世界の小店のAWS开机小助手</Typography>
      <Link sx={{ m: 2 }} underline="hover" variant="body2" href="https://github.com/hiDandelion/shizuku-launcher-web">访问项目仓库</Link>
      <div>
        <img src={Shizuku} alt="title-shizuku" />
      </div>
      <div>
        <FormControl sx={{ m: 1, width: 0.9, maxWidth: 600 }} variant="standard">
          <TextField label="Access Key ID" variant="outlined" size="small" onChange={(e) => {
            setAki(e.target.value);
          }} />
        </FormControl>
      </div>
      <div>
        <FormControl sx={{ m: 1, width: 0.9, maxWidth: 600 }}>
          <TextField label="Secret Access Key ID" variant="outlined" size="small" onChange={(e) => {
            setSaki(e.target.value);
          }} />
        </FormControl>
      </div>
      <div>
        <FormControl sx={{ m: 1 }}>
          <FormLabel id="mode-radio-buttons-group-label">运行模式</FormLabel>
          <RadioGroup
            row
            aria-labelledby="mode-radio-buttons-group-label"
            defaultValue={1}
            onChange={e => {
              setMode(parseInt(e.currentTarget.value))
            }}
          >
            <FormControlLabel value={1} control={<Radio />} label="本地" />
            <FormControlLabel value={2} control={<Radio />} label="远端" />
            {
              //Uncomment this when proxy-agent is ready to use
              //<FormControlLabel value={3} control={<Radio />} label="本地+代理（高级用户）" />
            }
            <FormControlLabel value={4} control={<Radio />} label="远端+代理（高级用户）" />
          </RadioGroup>
        </FormControl>
      </div>
      {mode === 1 ? (
        <div><Typography id="main-title" sx={{ m: 2 }} variant="body">本地模式：所有操作均在本地完成，凭证仅发送至AWS，更安全。</Typography></div>
      ) : (
        <></>
      )
      }
      {mode === 2 ? (
        <>
          <div>
            <FormControl sx={{ m: 1, width: 0.9, maxWidth: 600 }}>
              <TextField label="远端地址（可选）" variant="outlined" size="small" onChange={(e) => {
                setRemote(e.target.value);
                if (remote === "") {
                  setRemote(defaultRemote)
                }
              }} />
            </FormControl>
          </div>
          <div><Typography id="main-title" sx={{ m: 2 }} variant="body">远端模式：如果您的本地IP已遭滥用，使用远端模式可将凭证发送至远端服务器进行操作，匿名性更高。</Typography></div>
          <div><Typography id="main-title" sx={{ m: 2 }} variant="body">您可以自行搭建远端服务器，具体方法请访问<Link underline="hover" href="https://github.com/hiDandelion/shizuku-launcher-backend">后端项目仓库</Link>，如不填写远端地址将使用默认托管的服务器。</Typography></div>
        </>
      ) : (
        <></>
      )}
      {mode === 3 ? (
        <>
          <div>
            <FormControl sx={{ m: 1, width: 0.9, maxWidth: 600 }}>
              <TextField label="代理地址" variant="outlined" size="small" onChange={(e) => {
                setProxy(e.target.value);
              }} />
            </FormControl>
          </div>
          <div><Typography id="main-title" sx={{ m: 2 }} variant="body">本地+代理模式：操作在本地完成，请求通过代理服务器转发至AWS。</Typography></div>
          <div><Typography id="main-title" sx={{ m: 2 }} variant="body">您需要提供兼容的代理服务器地址，受支持的协议为：http/https/socks(v5)/socks5/socks4/pac。</Typography></div>
          <div><Typography id="main-title" sx={{ m: 2 }} variant="body">正确的格式范例：https://username:password@your-proxy.com</Typography></div>
        </>
      ) : (
        <></>
      )}
      {mode === 4 ? (
        <>
          <div>
            <FormControl sx={{ m: 1, width: 0.9, maxWidth: 600 }}>
              <TextField label="远端地址（可选）" variant="outlined" size="small" onChange={(e) => {
                setRemote(e.target.value);
                if (remote === "") {
                  setRemote(defaultRemote)
                }
              }} />
            </FormControl>
          </div>
          <div>
            <FormControl sx={{ m: 1, width: 0.9, maxWidth: 600 }}>
              <TextField label="代理地址" variant="outlined" size="small" onChange={(e) => {
                setProxy(e.target.value);
              }} />
            </FormControl>
          </div>
          <div><Typography id="main-title" sx={{ m: 2 }} variant="body">本地+代理模式：操作在远端完成，请求通过代理服务器转发至AWS，匿名性最高。</Typography></div>
          <div><Typography id="main-title" sx={{ m: 2 }} variant="body">您需要提供兼容的代理服务器地址，受支持的协议为：http/https/socks(v5)/socks5/socks4/pac。</Typography></div>
          <div><Typography id="main-title" sx={{ m: 2 }} variant="body">正确的格式范例：https://username:password@your-proxy.com</Typography></div>
        </>
      ) : (
        <></>
      )}
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
        >
          <Typography>启动实例</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div>
            <FormControl sx={{ m: 1, minWidth: 100 }} size="small">
              <InputLabel id="select-region-label">地区</InputLabel>
              <Select labelId="select-region-label" label="地区" value={liRegion} onChange={e => {
                setLiRegion(e.target.value);
              }}>
                {regions.map((r, i) =>
                  <MenuItem key={i} value={r}>{regionsDetail[i]}</MenuItem>
                )}
              </Select>
            </FormControl>
            <FormControl sx={{ m: 1, minWidth: 150 }} size="small">
              <InputLabel id="select-region-label">操作系统</InputLabel>
              <Select labelId="select-system-label" label="操作系统" value={system} onChange={e => {
                setSystem(e.target.value);;
              }}>
                {systems.map((r, i) =>
                  <MenuItem key={i} value={r}>{r}</MenuItem>
                )}
              </Select>
            </FormControl>
            <FormControl sx={{ m: 1, minWidth: 150 }} size="small">
              <InputLabel id="select-region-label">实例类型</InputLabel>
              <Select labelId="select-type-label" label="实例类型" value={type} onChange={e => {
                setType(e.target.value);
              }}>
                {types.map((r, i) =>
                  <MenuItem key={i} value={r}>{r}</MenuItem>
                )}
              </Select>
            </FormControl>
            <div>
              <FormControl sx={{ m: 1, minWidth: 150 }}>
                <TextField label="密码" type="password" variant="outlined" size="small" onChange={(e) => {
                  setPassword(e.target.value);
                }} />
              </FormControl>
            </div>
          </div>
          {isLaunchingInstance ? (<CircularProgress />) : (
            <div>
              <FormControl>
                <Button variant="contained" size="small" onClick={launchInstance}>执行</Button>
              </FormControl>
            </div>)}
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
        >
          <Typography>查询配额</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div>
            <FormControl sx={{ m: 1, minWidth: 100 }} size="small">
              <InputLabel id="select-region-label">地区</InputLabel>
              <Select labelId="select-region-label" label="地区" value={gqRegion} onChange={e => {
                setGqRegion(e.target.value);
              }}>
                {regions.map((r, i) =>
                  <MenuItem key={i} value={r}>{regionsDetail[i]}</MenuItem>
                )}
              </Select>
            </FormControl>
          </div>
          {isGettingQuota ? (<CircularProgress />) : (
            <div>
              <FormControl>
                <Button variant="contained" size="small" onClick={getQuota}>执行</Button>
              </FormControl>
            </div>
          )}
        </AccordionDetails>
      </Accordion>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="panel1a-content"
        >
          <Typography>查看实例详细信息</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <div>
            <FormControl sx={{ m: 1, minWidth: 100 }} size="small">
              <InputLabel id="select-region-label">地区</InputLabel>
              <Select labelId="select-region-label" label="地区" value={ciRegion} onChange={e => {
                setCiRegion(e.target.value);
              }}>
                {regions.map((r, i) =>
                  <MenuItem key={i} value={r}>{regionsDetail[i]}</MenuItem>
                )}
              </Select>
            </FormControl>
          </div>
          {isCheckingInstances ? (<CircularProgress />) : (
            <div>
              <FormControl>
                <Button variant="contained" size="small" onClick={checkInstances}>执行</Button>
              </FormControl>
            </div>
          )}
          {isCheckedInstances ? (
            <TableContainer component={Paper}>
              <Table sx={{ minWidth: 650 }} size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>id</TableCell>
                    <TableCell>状态</TableCell>
                    <TableCell>公网ip</TableCell>
                    <TableCell>实例类型</TableCell>
                    <TableCell>操作系统</TableCell>
                    <TableCell>操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {instances.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{states.get(row.state)}</TableCell>
                      <TableCell>{row.ip}</TableCell>
                      <TableCell>{row.type}</TableCell>
                      <TableCell>{row.platform}</TableCell>
                      <TableCell>
                        <Box sx={{ '& button': { m: 1 } }}>
                          {idOfInstanceChangingIp === row.id || idOfInstanceTerminating === row.id ? (<CircularProgress />) : (
                            <div>
                              <Button size="small" variant="outlined" onClick={() => changeInstanceIp(row.id)}>更换ip</Button>
                              <Button size="small" variant="outlined" color="error" onClick={() => terminateInstance(row.id)}>终止</Button>
                            </div>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (<></>)}
        </AccordionDetails>
      </Accordion>
      <div>
        <Dialog
          open={dialogOpen}
          onClose={() => { setDialogOpen(false); }}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {dialogTitle}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {dialogDescription}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => { setDialogOpen(false); }}>OK</Button>
          </DialogActions>
        </Dialog>
      </div>
    </div>

  );
}

export default App;
