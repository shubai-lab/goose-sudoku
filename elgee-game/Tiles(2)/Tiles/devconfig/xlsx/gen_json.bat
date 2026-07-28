


@IF %ERRORLEVEL% NEQ 0 pause

tabtoy ^
--mode=exportorv2 ^
--protover=3 ^
--fieldOutTag=c ^
--json_out=..\..\bin\res\config\GameConfig.json ^
--combinename=question_bank_conf ^
--lan=zh_cn ^
type_conf.xlsx ^
level_conf.xlsx ^
layer_conf.xlsx


@IF %ERRORLEVEL% NEQ 0 pause