import * as fs from 'fs';
import * as path from 'path';
class Config {
    constructor(userpath) {
        this.path = userpath;
    }
    static load(userpath) {
        if (!fs.existsSync(userpath)) {
            console.error(new Error('File does not exist!'));
        }
        let config_string = fs.readFileSync(path.normalize(userpath), { encoding: 'utf8' });
        config_string = config_string.replace(/(?:[,\r"' ])/g, '').split(/\n/g).map((chunk) => chunk.indexOf('#') != -1 ? chunk.substr(0, chunk.indexOf('#')) : chunk).map((chunk) => chunk.split(/:(.+)/, 2));
        let config = {};
        let object_start;
        let array_start;
        config_string.forEach((chunk) => {
            if (chunk[0] == '')
                return;
            if (chunk[1] == '{' || chunk[1] == '[') {
                if (chunk[1] == '{') {
                    config[chunk[0]] = chunk[1];
                    object_start = chunk[0];
                }
                else {
                    config[chunk[0]] = chunk[1];
                    array_start = chunk[0];
                }
            }
            else if (chunk[0] == '}' || chunk[0] == ']') {
                if (chunk[0] == '}') {
                    config[object_start] = config[object_start].substr(0, config[object_start].length - 1);
                    config[object_start] += chunk[0];
                    object_start = undefined;
                }
                else {
                    config[array_start] = config[array_start].substr(0, config[array_start].length - 1);
                    config[array_start] += chunk[0];
                    array_start = undefined;
                }
            }
            else {
                if (object_start != undefined) {
                    config[object_start] += `"${chunk[0]}":"${chunk[1]}",`;
                }
                else if (array_start != undefined) {
                    config[array_start] += `"${chunk[0]}",`;
                }
                else {
                    config[chunk[0]] = chunk[1];
                }
            }
        });
        return config;
    }
    get(specify) {
        this.conf = this.conf ? this.conf : Config.load(this.path);
        if (specify) {
            let specified = {};
            for (const key in this.conf) {
                if (this.conf.hasOwnProperty(key) && key.split('_')[0] == specify) {
                    const selector = key.split('_')[1];
                    if (selector == undefined) {
                        specified = this.conf[key];
                    }
                    else {
                        specified[selector] = this.conf[key];
                    }
                    try {
                        if (selector == undefined) {
                            if (specified.charAt(0) == '{' || specified.charAt(0) == '[') {
                                specified = JSON.parse(this.conf[key]);
                            }
                        }
                        else {
                            if (specified[selector].charAt(0) == '{' || specified[selector].charAt(0) == '[') {
                                specified[selector] = JSON.parse(this.conf[key]);
                            }
                        }
                    }
                    catch (error) {
                        console.log('you can ignore this: ' + error);
                        return;
                    }
                }
            }
            return specified;
        }
        return this.conf;
    }
    has(key) {
        this.conf = this.conf ? this.conf : Config.load(this.path);
        let specified = {};
        for (const k in this.conf) {
            if (this.conf.hasOwnProperty(k) && k.split('_')[0] == key)
                return true;
        }
    }
    set(key, value) {
        this.conf = this.conf ? this.conf : Config.load(this.path);
        this.conf[key] = value;
    }
    save() {
        if (this.conf == Config.load(this.path))
            return;
        fs.writeFileSync(this.path, Config.fromObject(this.conf));
    }
    static fromObject(obj) {
        return Config.fromJSON(JSON.stringify(obj));
    }
    static fromJSON(json_obj) {
        json_obj = json_obj.replace(/["\s]/g, '');
        const cfg = json_obj.slice(1, json_obj.length - 1).replace(/,/g, '\n');
        console.log(cfg);
        return cfg;
    }
}
export default Config;
