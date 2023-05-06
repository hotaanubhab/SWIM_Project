const fs = require('fs');
const axios = require('axios').default;
const { nanoid } = require('nanoid');

const util = require('util');
const path = require('path');
const exec = util.promisify(require('child_process').exec);
const env = require('../environment');
const { Console } = require('console');

let imageDB = []

exports.runDetect = async (req,res,next) => {
    const { stdout, stderr } = await exec('cd ../yolov5 && python detect.py --weights runs/train/Trained_SolidWaste2/weights/best.pt --source g1.jpg --conf 0.2 --name g1 --save-txt --save-conf');
    console.log('stdout:', stdout);
    console.error('stderr:', stderr);
    res.status(200).json({'success' : stderr});
};

exports.viewImages = async (req,res,next) => {
  res.status(200).json({imageDB});
};

exports.uploadImageForm = async (req,res,next) => {
  res.render('upload');
};

function formatUrl(url) {
  // Replace backslashes with forward slashes
  url = url.replace(/[\\]/g, '/');
  // Replace colon after http with double forward slashes
  url = url.slice(0,5)+'/'+url.slice(5)
  // Return formatted URL
  return url;
}

exports.uploadFile = async (req,res,next) => {
  console.log(req.files);
  let targetFile = req.files['photo'];
  console.log(targetFile)
  
  //mv(path, CB function(err))
  targetFile.mv(path.join(__dirname,"..","..","yolov5","data","images",targetFile.name), async (err) => {
      if (err)
          return res.status(500).send(err);
      else {
            let tmnow = Date.now().toString();
            const { stdout, stderr } = await exec(`cd ../yolov5 && python detect.py --weights runs/train/exp5/weights/best.pt --source data/images/"${targetFile.name}" --name "${tmnow+targetFile.name}" --save-txt --save-conf --conf 0.2`);

            let detected_URL = path.join("http://192.168.56.1:8080","runs","detect",tmnow+targetFile.name,targetFile.name).toString();
            let original_URL = path.join("http://192.168.56.1:8080","data","images",targetFile.name).toString();
            detected_URL = formatUrl(detected_URL)
            original_URL = formatUrl(original_URL)
            let createParams = {
            
              timestamp : Date.now().toString(),
              original_URL : original_URL,
              detected_URL : detected_URL,
              filename : targetFile.name,
            
            };
            imageDB.push(createParams);

            try { 
            res.status(200).json({file_path : detected_URL});
            }
            catch(err) {
            res.status(200).json({err : err});
            }
          }

        });
      }
