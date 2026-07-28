var exec = require('child_process').exec;
var fs = require('fs');
var path = require("path");
function startInput()
{
	process.stdout.write('请拖入文件夹后按Enter确认\n');
	process.stdin.on('data',(input)=>{
		input = input.toString().trim();
		if (input.length > 0)
		{	
            //process.exit(0);
            startAtlas(input);
			return;
		}
		//process.exit(0);
	});
}

function startAtlas(inputFile)
{
    var file = "./bin/TP/atlas-generator.exe";
    //console.log(inputFile);
    var outputFile = inputFile.replace("atlas", "bin/res/assets");
	if(outputFile.indexOf("window") >= 0 || outputFile.indexOf("baseUI") >= 0 || outputFile.indexOf("selfseat") >= 0 || outputFile.indexOf("seat") >= 0 || outputFile.indexOf("gameBase") >= 0)
	{
		outputFile = path.join(outputFile, "..");
	}
	if(outputFile.indexOf("cards") >= 0)
	{
		outputFile = path.join(outputFile, "normal");
    }
	// var outputFile = inputFile;
    var cmd = "\"" + file + "\"" +
        " -S " + 2048 +//图集最大宽度
        " -s " + 1600 +//单图最大宽度
        " \"" + inputFile + "\"" +
        " -o " + "\"" + outputFile + "\"" +
        " --dataFormat " + "atlas" + 
        " --scale " + 1;
    if (true)
    {
        cmd += " --force";
    }
    //2的整次幂
    // if (checkbox2.checked)
    // {
    // 	cmd += " -2";
    // }
    //空白裁剪
    // if (checkbox.checked)
    // {
    // 	cmd += " -c";
    // }
    exec(cmd,
    {
        encoding: "binary",
        maxBuffer: 1024 * 1024 * 20
    }, function(err, stdOut, stdErr)
    {
        if(err)
            console.log(err + stdErr);
        else
        {
			recPath = path.join(outputFile, "/.rec");
            fs.unlink(recPath,function(error){
                if(error){
                    console.log(error);
                    return false;
                }
                if(stdOut)
                {
                    //'SIZE bin(912, 896) canvas(910, 896)\r'
                    //SAVE D:/Work
                    let arr = stdOut.trim().split('\r\n');
                    arr = arr.filter(value => { return value.indexOf("SIZE") >= 0 || (value.indexOf("SAVE") >= 0 && value.indexOf(".atlas") < 0); });
                    arr = arr.map(value => {
                        if(value.indexOf("SIZE") >= 0)
                        {
                            let index = value.indexOf("canvas(");
                            return value.substring(index + 7, value.length - 1);
                        }
                        else if(value.indexOf("SAVE") >= 0 )
                        {
                            return value.substring(4);
                        }
                    });
                    console.log("转换成功，生成如下文件");
                    for(let i=0; i<arr.length; i+= 2)
                    {
                        let sizeStr = arr[i];
                        let sizeArr = sizeStr.trim().split(", ");
                        let fileStr = arr[i+ 1];
                        if(sizeArr[0] > 1024 || sizeArr[1] > 1024)
                        {
                            console.log('\x1B[31m%s\x1B[39m', fileStr + " 大小" + sizeArr[0] + "x" + sizeArr[1]);
                        }
                        else
                        {
                            console.log(fileStr + " 大小" + sizeArr[0] + "x" + sizeArr[1]);
                        }
                    }
                }
                else
                    console.log("转换成功, 图片放在", outputFile);
                console.log("请拖入文件夹后按Enter确认\n");
            });
        }
        
    });
}

startInput();
