import {
    Controller,
    Get,
    Query,
    Post,
    Body,
    Head,
    Header
} from '@nestjs/common';
const l = console.log;

@Controller('test')
export class TestController {

    @Get('text')
    @Header('Access-Control-Allow-Origin', '*')
    @Header('content-type', 'application/text;charset=utf-8')
    resText(@Query() query) {
        l(query)
        return '服务器返回一个字符传。'
    }

    @Get('json')
    @Header('content-type', 'application/json;charset=utf-8')
    @Header('Access-Control-Allow-Origin', '*')
    resJson(@Query() query) {
        l(query)
        return {
            msg: '服务器返回一个json。'
        }
    }

    @Post('post')
    @Header('Access-Control-Allow-Origin', '*')
    @Header('content-type', 'application/json;charset=utf-8')
    create(@Body() body) {
        l('body')
        l(body)
        return {
            msg: 'post ok...'
        }
    }
}