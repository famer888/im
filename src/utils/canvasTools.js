
export const canvasAddTest = (canvas, ctx, text, options) => {
    let { 
        fontSize = '14px', 
        fontFamily = 'Arial', 
        color = '#000000', 
        x = null, 
        y = null 
    } = options || {}
    // 设置文本内容和样式  
    ctx.font = fontSize + ' ' + fontFamily;
    ctx.fillStyle = color;  

    // 测量文本宽度  
    var textWidth = ctx.measureText(text).width;

    // 计算文本的水平居中位置  
    if (x === undefined || x === null) {
        x = (canvas.width - textWidth) / 2;
    }
    if (y === undefined || y === null)
        y = canvas.height / 2; // 假设垂直位置也在中间  
    // 绘制文本  
    ctx.fillText(text, x, y);
    return ctx
}

// 绘制带圆角的图片
export const canvasAddRadiusImg = (canvas, ctx, img, imgX, imgY, imgWidth, imgHeight, radius) => {  
    //裁切半径
    radius = radius || 100;  
    var centerX = imgX + imgWidth / 2;  
    var centerY = imgY + imgHeight / 2;  
    // 保存当前状态  
    ctx.save();  
    // 绘制圆形裁剪区域  
    ctx.beginPath();  
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);  
    ctx.clip();  

    ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);  
  
    // 恢复之前保存的状态，以取消裁剪  
    ctx.restore();  
}  
  
  