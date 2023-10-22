const fs = require("fs");
const sharp = require("sharp");

// Configurations
const directory = "./optimized";
const maxWidth = 1920;
const maxHeight = 1080;
const ratio = [1]; // 0.25, 0.5, 0.75, 1, 2

// Processing
if (process.argv.length < 3) {
  console.error("Usage: node imageOptimizer.js <inputImagePath>");
  process.exit(1);
}

const inputImagePath = process.argv[2];
console.log(`Image: ${inputImagePath}`);
const outputImagePath = `new-${inputImagePath}`;

if (!fs.existsSync(inputImagePath)) {
  console.error(`Input file "${inputImagePath}" does not exist.`);
  process.exit(1);
}

// Create a readable stream from the input image file
const buffer = fs.readFileSync(inputImagePath);

if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory);
}

function cb(outputImagePath) {
  return function (err, info) {
    if (err) {
      console.error(err);
    } else {
      console.log(`NEW=${info.width}x${info.height} size=${info.size}`);
      console.log("Image resized successfully:", outputImagePath);
    }
  };
}

function optimize(newWidth, newHeight) {
  const isOneSize = ratio.length <= 1;
  const imageName = inputImagePath.substring(
    0,
    inputImagePath.lastIndexOf(".")
  );

  if (isOneSize) {
    let scale = 1;
    if (ratio.length === 1) {
      scale = ratio[0];
    }

    const fileName = `${directory}/${imageName}.jpg`;

    sharp(buffer)
      .jpeg({ mozjpeg: true, quality: 75 })
      .resize(Math.ceil(newWidth * scale), Math.ceil(newHeight * scale), {
        fit: "inside",
      })
      .toFile(fileName, cb(fileName));
    return;
  }

  const finalDir = `${directory}/${imageName}`;
  console.log("Images path: " + finalDir);

  for (let i = 0; i < ratio.length; i++) {
    if (!fs.existsSync(finalDir)) {
      fs.mkdirSync(finalDir);
    }

    const fileName = `${finalDir}/${imageName}-${ratio[i]}.jpg`;

    sharp(buffer)
      .jpeg({ mozjpeg: true, quality: 75 })
      .resize(Math.ceil(newWidth * ratio[i]), Math.ceil(newHeight * ratio[i]), {
        fit: "inside",
      })
      .toFile(fileName, cb(fileName));
  }
}

sharp(buffer)
  .metadata()
  .then((metadata) => {
    console.log(
      `OLD=${metadata.width}x${metadata.height} size=${metadata.size}`
    );
    let newWidth = metadata.width;
    let newHeight = metadata.height;
    let scale = 1;
    if (metadata.width > maxWidth || metadata.height > maxHeight) {
      const widthRatio = maxWidth / metadata.width;
      const heightRatio = maxHeight / metadata.height;
      const widthBigger = widthRatio < heightRatio;
      scale = widthBigger ? widthRatio : heightRatio;

      if (widthBigger) {
        newWidth = maxWidth;
        newHeight = Math.ceil(metadata.height * scale);
      } else {
        newWidth = Math.ceil(metadata.width * scale);
        newHeight = maxHeight;
      }
    }

    console.log("Scale: " + scale);

    optimize(newWidth, newHeight);
  });
