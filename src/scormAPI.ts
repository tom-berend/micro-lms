/**
 * https://github.com/gamestdio/scorm
 * 
 * Based on pipwerks SCORM Wrapper for JavaScript
 * Created by Philip Hutchison, January 2008-2016
 */







// Public API

export class Scorm {
    version: string = '';    // tom - added empty string so never 'undefined'
    handleExitMode: boolean = true;
    handleCompletionStatus: boolean = true;
    isDebugActive: boolean = true;
    exitStatus: any;

    apiHandle: any = null;
    isAPIFound = false;

    isActive = false;
    completionStatus: any;

    configure(config: {
        version?: string; // SCORM version.
        debug?: boolean;
        handleExitMode?: boolean; // Whether or not the wrapper should automatically handle the exit mode
        handleCompletionStatus?: boolean; // Whether or not the wrapper should automatically handle the initial completion status
    } = {}) {
        this.version = config.version ?? '';

        this.handleExitMode = (config.handleExitMode === undefined)
            ? !!config.handleExitMode
            : true;

        this.handleCompletionStatus = (config.handleCompletionStatus === undefined)
            ? !!config.handleCompletionStatus
            : true;

        this.isDebugActive = (config.debug === undefined)
            ? !!config.debug
            : true;
    }

    initialize() {
        let success = false,
            traceMsgPrefix = 'scorm.initialize ';

        this.debug('connection.initialize called.');

        if (!this.isActive) {
            let API = this.getHandle(),
                errorCode = 0;


            if (API) {
                switch (this.version) {
                    case '1.2':
                        success = toBoolean(API.LMSInitialize('')) ?? false;
                        break;
                    case '2004':
                        success = toBoolean(API.Initialize('')) ?? false;
                        break;
                }

                if (success) {
                    //Double-check that connection is active and working before returning 'true' boolean
                    errorCode = this.getLastError();

                    if (errorCode !== null && errorCode === 0) {
                        this.isActive = true;

                        if (this.handleCompletionStatus) {
                            //Automatically set new launches to incomplete
                            this.completionStatus = this.status();

                            if (this.completionStatus) {
                                switch (this.completionStatus) {
                                    //Both SCORM 1.2 and 2004
                                    case 'not attempted':
                                        this.status('incomplete');
                                        break;

                                    //SCORM 2004 only
                                    case 'unknown':
                                        this.status('incomplete');
                                        break;

                                    //Additional options, presented here in case you'd like to use them
                                    //case "completed"  : break;
                                    //case "incomplete" : break;
                                    //case "passed"     : break;    //SCORM 1.2 only
                                    //case "failed"     : break;    //SCORM 1.2 only
                                    //case "browsed"    : break;    //SCORM 1.2 only
                                }

                                //Commit changes
                                this.commit();
                            }
                        }
                    } else {
                        success = false;
                        this.debug(
                            traceMsgPrefix +
                            'failed. \nError code: ' +
                            errorCode +
                            ' \nError info: ' +
                            this.getErrorString(errorCode),
                        );
                    }
                } else {
                    errorCode = this.getLastError();

                    if (errorCode !== null && errorCode !== 0) {
                        this.debug(
                            traceMsgPrefix +
                            'failed. \nError code: ' +
                            errorCode +
                            ' \nError info: ' +
                            this.getErrorString(errorCode),
                        );
                    } else {
                        this.debug(traceMsgPrefix + 'failed: No response from server.');
                    }
                }
            } else {
                this.debug(traceMsgPrefix + 'failed: API is null.');
            }
        } else {
            this.debug(traceMsgPrefix + 'aborted: Connection already active.');
        }

        return success;
    }


    terminate() {
        let success = false,
            traceMsgPrefix = 'scorm.terminate ';

        if (this.isActive) {
            let API = this.getHandle(),
                errorCode = 0;

            if (API) {
                if (this.handleExitMode && !this.exitStatus) {
                    if (this.completionStatus !== 'completed' && this.completionStatus !== 'passed') {
                        switch (this.version) {
                            case '1.2':
                                success = this.set('cmi.core.exit', 'suspend');
                                break;
                            case '2004':
                                success = this.set('cmi.exit', 'suspend');
                                break;
                        }
                    } else {
                        switch (this.version) {
                            case '1.2':
                                success = this.set('cmi.core.exit', 'logout');
                                break;
                            case '2004':
                                success = this.set('cmi.exit', 'normal');
                                break;
                        }
                    }
                }

                //Ensure we persist the data
                success = this.commit();

                if (success) {
                    switch (this.version) {
                        case '1.2':
                            success = toBoolean(API.LMSFinish('')) ?? false;
                            break;
                        case '2004':
                            success = toBoolean(API.Terminate('')) ?? false;
                            break;
                    }

                    if (success) {
                        this.isActive = false;
                    } else {
                        errorCode = this.getLastError();
                        this.debug(
                            traceMsgPrefix +
                            'failed. \nError code: ' +
                            errorCode +
                            ' \nError info: ' +
                            this.getErrorString(errorCode),
                        );
                    }
                }
            } else {
                this.debug(traceMsgPrefix + 'failed: API is null.');
            }
        } else {
            this.debug(traceMsgPrefix + 'aborted: Connection already terminated.');
        }

        return success;
    }


    get(parameter: string | number) {
        let value = null,
            traceMsgPrefix = "scorm.get('" + parameter + "') ";

        if (this.isActive) {
            let API = this.getHandle(),
                errorCode = 0;

            if (API) {
                switch (this.version) {
                    case '1.2':
                        value = API.LMSGetValue(parameter);
                        break;
                    case '2004':
                        value = API.GetValue(parameter);
                        break;
                }

                errorCode = this.getLastError();

                //GetValue returns an empty string on errors
                //If value is an empty string, check errorCode to make sure there are no errors
                if (value !== '' || errorCode === 0) {
                    //GetValue is successful.
                    //If parameter is lesson_status/completion_status or exit status, let's
                    //grab the value and cache it so we can check it during connection.terminate()
                    switch (parameter) {
                        case 'cmi.core.lesson_status':
                        case 'cmi.completion_status':
                            this.completionStatus = value;
                            break;

                        case 'cmi.core.exit':
                        case 'cmi.exit':
                            this.exitStatus = value;
                            break;
                    }
                } else {
                    this.debug(
                        traceMsgPrefix +
                        'failed. \nError code: ' +
                        errorCode +
                        '\nError info: ' +
                        this.getErrorString(errorCode),
                    );
                }
            } else {
                this.debug(traceMsgPrefix + 'failed: API is null.');
            }
        } else {
            this.debug(traceMsgPrefix + 'failed: API connection is inactive.');
        }

        this.debug(traceMsgPrefix + ' value: ' + value);

        return String(value);
    }

    set(parameter: string, value: string | number) {
        let success = false,
            traceMsgPrefix = "scorm.set('" + parameter + "') ";

        if (this.isActive) {
            let API = this.getHandle(),
                errorCode = 0;

            if (API) {
                switch (this.version) {
                    case '1.2':
                        success = toBoolean(API.LMSSetValue(parameter, value)) ?? false;
                        break;
                    case '2004':
                        success = toBoolean(API.SetValue(parameter, value)) ?? false;
                        break;
                }

                if (success) {
                    if (
                        parameter === 'cmi.core.lesson_status' ||
                        parameter === 'cmi.completion_status'
                    ) {
                        this.completionStatus = value;
                    }
                } else {
                    errorCode = this.getLastError();

                    this.debug(
                        traceMsgPrefix +
                        'failed. \nError code: ' +
                        errorCode +
                        '. \nError info: ' +
                        this.getErrorString(errorCode),
                    );
                }
            } else {
                this.debug(traceMsgPrefix + 'failed: API is null.');
            }
        } else {
            this.debug(traceMsgPrefix + 'failed: API connection is inactive.');
        }

        this.debug(traceMsgPrefix + ' value: ' + value);

        return success;
    }

    commit() {
        let success = false,
            traceMsgPrefix = 'scorm.commit failed';

        if (this.isActive) {
            let API = this.getHandle();

            if (API) {
                switch (this.version) {
                    case '1.2':
                        success = toBoolean(API.LMSCommit('')) ?? false;
                        break;
                    case '2004':
                        success = toBoolean(API.Commit('')) ?? false;
                        break;
                }
            } else {
                this.debug(traceMsgPrefix + ': API is null.');
            }
        } else {
            this.debug(traceMsgPrefix + ': API connection is inactive.');
        }

        return success;
    }


    // status is a shorthand for   get/set cmi_lesson_status, not part of the SCORM interface doc
    status(status?: string) {
        let success: any = false,
            traceMsgPrefix = 'scorm.status failed',
            cmi = '',
            action = (arguments.length === 0) ? 'get' : 'set';

        switch (this.version) {
            case '1.2':
                cmi = 'cmi.core.lesson_status';
                break;
            case '2004':
                cmi = 'cmi.completion_status';
                break;
        }

        switch (action) {
            case 'get':
                success = this.get(cmi);
                break;

            case 'set':
                if (status !== undefined) {
                    success = this.set(cmi, status);
                } else {
                    success = false;
                    this.debug(traceMsgPrefix + ': status was not specified.');
                }

                break;

            default:
                success = false;
                this.debug(traceMsgPrefix + ': no valid action was specified.');
        }

        return success;
    }

    getLastError() {
        let API = this.getHandle(),
            code = 0;

        if (API) {
            switch (this.version) {
                case '1.2':
                    code = parseInt(API.LMSGetLastError(), 10);
                    break;
                case '2004':
                    code = parseInt(API.GetLastError(), 10);
                    break;
            }
        } else {
            this.debug('scorm.getLastError failed: API is null.');
        }

        return code;
    }

    getErrorString(errorCode: number) {
        let API = this.getHandle(),
            result = '';

        if (API) {
            switch (this.version) {
                case '1.2':
                    result = API.LMSGetErrorString(errorCode.toString());
                    break;
                case '2004':
                    result = API.GetErrorString(errorCode.toString());
                    break;
            }
        } else {
            this.debug('scorm.getErrorString failed: API is null.');
        }

        return String(result);
    }

    getDiagnostic(errorCode: number) {
        let API = this.getHandle(),
            result = '';

        if (API) {
            switch (this.version) {
                case '1.2':
                    result = API.LMSGetDiagnostic(errorCode);
                    break;
                case '2004':
                    result = API.GetDiagnostic(errorCode);
                    break;
            }
        } else {
            this.debug('scorm.getDiagnostic failed: API is null.');
        }

        return String(result);
    }


    /* Looks for an object named API  or API_1484_11 in parent and opener windows
    *  Parameters: window (the browser window object).
    *  Returns:    Object if API is found, null if no API found */
    find(win: any): object | null {
        let API = null,
            findAttempts = 0,
            findAttemptLimit = 500,
            traceMsgPrefix = 'SCORM.API.find';

        while (
            !win.API &&
            !win.API_1484_11 &&
            win.parent &&
            win.parent != win &&
            findAttempts <= findAttemptLimit
        ) {
            findAttempts++;
            win = win.parent;
        }

        //If SCORM version is specified by user, look for specific API
        if (this.version) {

            switch (this.version) {
                case '2004':
                    if (win.API_1484_11) {
                        API = win.API_1484_11;
                    } else {
                        this.debug(
                            traceMsgPrefix +
                            ': SCORM version 2004 was specified by user, but API_1484_11 cannot be found.',
                        );
                    }

                    break;

                case '1.2':
                    if (win.API) {
                        API = win.API;
                    } else {
                        this.debug(
                            traceMsgPrefix +
                            ': SCORM version 1.2 was specified by user, but API cannot be found.',
                        );
                    }

                    break;
            }
        } else {
            //If SCORM version not specified by user, look for APIs

            console.log('TOM68', this.version)

            console.log('scorm version is not known')
            if (win.API_1484_11) {
                //SCORM 2004-specific API.

                this.version = '2004'; //Set version
                API = win.API_1484_11;
            } else if (win.API) {
                //SCORM 1.2-specific API

                this.version = '1.2'; //Set version
                API = win.API;
            }
        }

        if (API) {
            this.debug(traceMsgPrefix + ': API found. Version: ' + this.version);
            this.debug('API: ' + API);
        } else {
            this.debug(
                traceMsgPrefix +
                ': Error finding API. \nFind attempts: ' +
                findAttempts +
                '. \nFind attempt limit: ' +
                findAttemptLimit,
            );
        }

        return API;
    };

    debug(msg: string) {
        if (this.isDebugActive) {
            window.console.log(msg);
        }
    };


    /* Looks for an object named API, first in the current window's frame
    *  hierarchy and then, if necessary, in the current window's opener window
    *  hierarchy (if there is an opener window).
    *  Returns:     Object if API found, null if no API found */
    getAPI() {
        let API = null,
            win = window;

        API = this.find(win);

        if (!API && win.parent && win.parent != win) {
            API = this.find(win.parent);
        }

        if (!API && win.top && win.top.opener) {
            API = this.find(win.top.opener);
        }

        //Special handling for Plateau
        //Thanks to Joseph Venditti for the patch
        if (!API && win.top && win.top.opener && win.top.opener.document) {
            API = this.find(win.top.opener.document);
        }

        if (API) {
            this.isAPIFound = true;
        } else {
            this.debug("getAPI failed: Can't find the API!");
        }

        return API;
    };




    /* Returns the handle to API object if it was previously set
    * Parameters:  None.
    * Returns:     Object (the api.handle variable). */
    getHandle() {
        if (!this.apiHandle && !this.isAPIFound) {
            this.apiHandle = this.getAPI();
        }
        return this.apiHandle;
    };


}

export function toBoolean(value: any) {
    switch (typeof (value)) {
        case 'object':
        case 'string':
            return /(true|1)/i.test(value);
        case 'number':
            return !!value;
        case 'boolean':
            return value;
        case 'undefined':
            return null;
        default:
            return false;
    }
};

//export let scorm = new Scorm();
