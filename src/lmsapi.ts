// this is the windows.API layer of the LMS

import { MicroLMS } from './microlms'
import { errString, ERR } from './defines'

// http://scorm.com/scorm-explained/technical-scorm/run-time/run-time-reference/




// SCORM 1.2  API Signature
//
// LMSInitialize( “” ) : bool – Begins a communication session with the LMS.
// LMSFinish( “” ) : bool – Ends a communication session with the LMS.
// LMSGetValue( element : CMIElement ) : string – Retrieves a value from the LMS.
// LMSSetValue( element : CMIElement, value : string) : string – Saves a value to the LMS.
// LMSCommit( “” ) : bool – Indicates to the LMS that all data should be persisted (not required).
// LMSGetLastError() : CMIErrorCode – Returns the error code that resulted from the last API call.
// LMSGetErrorString( errorCode : CMIErrorCode ) : string – Returns a short string describing the specified error code.
// LMSGetDiagnostic( errorCode : CMIErrorCode ) : string – Returns detailed information about the last error that occurred.


// SCORM 2004 2nd & 4th Edition   API Signature
//
// Initialize( “” ) : bool – Begins a communication session with the LMS.
// Terminate( “” ) : bool – Ends a communication session with the LMS.
// GetValue( element : CMIElement ) : string – Retrieves a value from the LMS.
// SetValue( element : CMIElement, value : string) : string – Saves a value to the LMS.
// Commit( “” ) : bool – Indicates to the LMS that all data should be persisted (not required).
// GetLastError() : CMIErrorCode – Returns the error code that resulted from the last API call.
// GetErrorString( errorCode : CMIErrorCode ) : string – Returns a short string describing the specified error code.
// GetDiagnostic( errorCode : CMIErrorCode ) : string – Returns detailed information about the last error that occurred.


// The bool type is a SCORM boolean, which is actually a string having the value “true” or “false”.
// The “” parameter is required by all SCORM methods that don’t accept any other arguments. SCOs are simply required to pass an empty string parameter to these methods.
// The CMIElement data type is a string corresponding to the SCORM data model elements described below.
// The CMIErrorCode data type is a three-digit number, represented a string, that corresponds to one of the SCORM Run-Time error codes.




let debug = true;




// The bool type is a SCORM boolean, which is actually a string having the value “true” or “false”.
type SCORMboolean = 'true' | 'false'

export class LMSAPI {

    status: 'Started' | 'Initialized' | 'Terminated'
    lastErrcode: number
    lastErrString: string
    sessionTime: number

    LMS: any

    constructor() {
        this.LMS = new MicroLMS()

        this.status = 'Started'   // but not initialized 
        this.sessionTime = Date.now()
        this.lastErrcode = ERR.NoError
        this.lastErrString = ''

        // terminate is called if the window is closed
        window.onbeforeunload = () => {
            this.Terminate("")
            return null   // don't want a confirm box
        }
    }

    /** Attaches the LMS API to the window object so that you can discover it */
    static attachLMSAPIToWindow() {   // NB - STATIC !!!
        (window as any).API = new LMSAPI();
        // (window as any).API_1484_11 = new LMSAPI();   // SCORM 2004
    }




    ///////////////////////////////////
    // this section are basic utilities
    ///////////////////////////////////

    _result(errcode: number, errString?: string) {
        this.lastErrcode = errcode;
        this.lastErrString = errString ?? ''
        // no return value, _fail or _ok does the work
    }

    _fail(errcode: number, errmsg = ''): SCORMboolean {
        let message = 'ERROR' + errmsg + ' ' + errString.get(errcode)
        console.error(`FAIL ${errcode} - ${message}`)
        this._result(errcode);
        return 'false';
    }

    _ok(): SCORMboolean {
        this._result(0 /* NO_ERROR */);
        return 'true';
    }


    /* return the current time in ISO 8601 format */
    isoDateNow(): string {
        return new Date(Date.now()).toISOString()  // '2021-04-30T21:38:08.331Z'
    }


    /* check that a string is a valid number */
    isNumeric(num: string): boolean {
        let regexNum = RegExp("^-?\\d*(\\.\\d+)?$")
        return regexNum.test(num)
    }
    // isoDateNow =  new Date(Date.now()).toISOString())  // '2021-04-30T21:38:08.331Z'


    ///////////////////////////////////////////////////////////////////
    // this section are minimal interfaces for SCORM 1.2 and SCORM 2004
    ///////////////////////////////////////////////////////////////////



    LMSInitialize(x: string): SCORMboolean {   // SCORM 1.2
        return this.Initialize(x)
    }

    Initialize(x: string): SCORMboolean {  // SCORM 2004 2nd Edition  
        if ("string" != typeof x || x.length !== 0) {
            console.error(`Expected empty string, got '${x}'`)
            return this._fail(ERR.GeneralArgumentError, 'Expected empty string');
        }

        if (this.status == 'Terminated') {
            return this._fail(ERR.ContentInstanceTerminated);
        }
        if (this.status == 'Initialized') {
            return this._fail(ERR.AlreadyInitialized);
        }

        this.status = 'Initialized'

        return this._ok()
    }



    LMSFinish(x: string): SCORMboolean {   // SCORM 1.2
        return this.Terminate(x)
    }
    Terminate(x: any): SCORMboolean {   // SCORM 2004 2nd Edition
        // whether successful or not, a call to Terminate() also calls Commit()
        this.LMSCommit("")

        if ("string" != typeof x || x.length !== 0) {
            console.error(`Expected empty string, got '${x}'`)
            return this._fail(ERR.GeneralArgumentError, 'Expected empty string');
        }
        if (this.status == 'Terminated') {
            return this._fail(ERR.TerminationAfterTermination);
        }
        if (this.status !== 'Initialized') {
            return this._fail(ERR.TerminationBeforeInitialization);
        }
        this.status = 'Terminated'
        return 'true'

        // }
        // this.status = FakeLMS.STATUS.TERMINATED;
        // // updating total_time by adding last set sessionTime
        // let totalTimeString = window.localStorage.getItem('total_time')
        // if (totalTimeString == null)
        //     totalTimeString = this.sessionTime.toString()
        // else
        //     totalTimeString = (parseInt(totalTimeString) + this.sessionTime).toString()

        // window.localStorage.setItem('total_time', totalTimeString);
        return this._ok();
    }


    LMSGetValue(path: string): string {   // SCORM 1.2
        return this.GetValue(path)
    }
    GetValue(path: any): string {    // SCORM 2004 2nd Edition

        if (this.status == 'Terminated') {
            return this._fail(ERR.RetrieveDataAfterTermination);
        }
        if (this.status !== 'Initialized') {
            return this._fail(ERR.RetrieveDataBeforeInitialization);
        }

        let [value, error] = this.LMS.dmGetValue(path)

        if (error !== ERR.NoError) {
            this._fail(error)
        } else {
            this._ok()
        }
        return value
    }



    LMSSetValue(path: string, value: string) {   // SCORM 1.2
        return this.SetValue(path, value)
    }

    SetValue(path: string, value: string | number) {    // SCORM 2004 2nd Edition
        console.log(`set value ${value} path ${path}`)

        if (this.status == 'Terminated') {
            return this._fail(ERR.StoreDataAfterTermination);
        }
        if (this.status !== 'Initialized') {
            return this._fail(ERR.StoreDataBeforeInitialization);
        }

        let error = this.LMS.dmSetValue(path, value)
        console.assert(error == 0, `error ${error} setting path '${path}' to value '${value}'`)
        if (error == ERR.NoError) {
            this._ok()
            return 'true'
        }
        else {
            this._fail(error)
            return 'false'
        }
    }

    //     //current_location seems to be a number in SCORM demo
    //     let stringValue = value.toString()        // force to string


    //     // if ('string' != typeof path || 'string' != typeof value) {
    //     //     return this._fail(ERR.InvalidArgument, 'SetValue takes strings as parameters');
    //     // }
    //     var parts = path.split('.');
    //     if (parts.length < 2) {
    //         return this._fail(ERR.InvalidArgument, JSON.stringify(parts));
    //     }
    //     if ('cmi' != parts) {
    //         return this._fail(ERR.InvalidArgument, `expected 'cmi' ` + JSON.stringify(parts));
    //     }
    //     if (-1 != ["total_time"].indexOf(parts[1])) {
    //         return this._fail(ERR.InvalidArgument, `did not find total time in ` + JSON.stringify(parts));
    //     }
    //     switch (parts[1]) {
    //         case 'exit':
    //             if (-1 == ["timeout", "suspend", "logout", "normal", ""].indexOf(stringValue)) {
    //                 return this._fail(ERR.InvalidArgument, 'out of range');
    //             }
    //             window.localStorage.setItem('exit', stringValue); // not really necessary ? (cms.exit is write-only)
    //             break;
    //         case 'completion_status':
    //             if (-1 == ["completed", "incomplete", "not attempted", "unknown"].indexOf(stringValue)) {
    //                 return this._fail(ERR.InvalidArgument, 'out of range');
    //             }
    //             window.localStorage.setItem('completion_status', stringValue);
    //             break;
    //         case 'success_status':
    //             if (-1 == ["passed", "failed", "unknown"].indexOf(stringValue)) {
    //                 return this._fail(ERR.InvalidArgument, 'out of range');
    //             }
    //             window.localStorage.setItem('success_status', stringValue);
    //             break;
    //         case 'sessionTime':
    //             var captured = /PT(\d+)S/.exec(stringValue);
    //             if (null == captured) {
    //                 return this._fail(ERR.InvalidArgument, "set cmi.sessionTime with value that do not match /PT\\d+S/ (sole pattern recognized so far)");
    //             }
    //             this.sessionTime = parseInt(captured[1]);
    //             break;
    //         case 'interactions':
    //             if (parts.length < 3) {
    //                 return this._fail(ERR.InvalidArgument, 'Unknown data element : ' + path);
    //             }

    //             let interactionsString = window.localStorage.getItem('interactions');
    //             let interactions: any // but hopefully 'object' or 'array

    //             if (null == interactionsString) {     // if not already set, then set to empty array
    //                 window.localStorage.setItem('interactions', JSON.stringify([]));  // empty array
    //             } else {
    //                 try {
    //                     interactions = JSON.parse(interactions);
    //                 } catch (e) {
    //                     return this._fail(ERR.GeneralException, "internal : interactions parse error : " + e.message);
    //                 }
    //             }
    //             if ('object' != typeof interactions) {
    //                 return this._fail(ERR.GeneralException, "internal : interactions is not an object");
    //             }
    //             if (!Array.isArray(interactions)) {
    //                 return this._fail(ERR.GeneralException, "internal : interactions is not an array");
    //             }
    //             var nbInteractions = interactions.length;
    //             switch (parts[2]) {
    //                 case '_count':
    //                 case '_children':
    //                     return this._fail(ERR.ElementIsReadOnly /*read only*/);
    //                 default:
    //                     if (parts.length < 4) {
    //                         return this._fail(ERR.InvalidArgument, 'unknown data element' + JSON.stringify(parts));
    //                     }
    //                     // must be an integer
    //                     if (!parts[2].match(/^[0-9]+$/)) {
    //                         return this._fail(ERR.InvalidArgument, 'unknown data element' + JSON.stringify(parts));
    //                     }
    //                 // var field = parts[3];
    //                 // if (-1 == FakeLMS.SUPPORTED_INTERACTIONS_FIELDS.indexOf(field)) {
    //                 //     return this._fail(ERR.NotImplemented, 'not initialized : ' + path);
    //                 // }
    //                 // if ('type' == field) {
    //                 //     if (-1 == FakeLMS.VALID_INTERACTIONS_TYPE_VALUES.indexOf(stringValue)) {
    //                 //         return this._fail(ERR.InvalidArgument, `out of range` + JSON.stringify(parts));
    //                 //     }
    //                 // }
    //                 // var n = parseInt(parts[2], 10);
    //                 // if (n >= nbInteractions) {
    //                 //     // initializing missing elements with 'blank' interactions
    //                 //     for (var i = nbInteractions; i <= n; i++) {
    //                 //         interactions.push({
    //                 //             id: i,
    //                 //             type: 'true-false',
    //                 //             learner_response: 'true'
    //                 //         });
    //                 //     }
    //                 // }
    //                 // interactions[n][field] = value;
    //                 // window.localStorage.setItem('interactions', JSON.stringify(interactions));
    //                 // break; // normal case
    //             }
    //             break;
    //         default:
    //             return this._fail(ERR.NotInitialized);
    //     }
    //     return this._ok();
    // }



    LMSCommit(x: string) {   // SCORM 1.2
        return this.Commit(x)
    }

    /**  Does nothing ! Should be called on real LMS though.   */
    Commit(x: any) {    // SCORM 2004 2nd Edition
        if ("string" != typeof x || x.length) {
            return this._fail(ERR.GeneralArgumentError);
        }
        if (this.status == 'Terminated') {
            return this._fail(ERR.CommitAfterTermination);
        }
        if (this.status !== 'Initialized') {
            return this._fail(ERR.CommitBeforeInitialization);
        }

        return this._ok();
    }



    LMSGetLastError() {   // SCORM 1.2
        return this.GetLastError()
    }
    GetLastError() {  // SCORM 2004 2nd Edition
        return this.lastErrcode;
    }


    LMSGetErrorString(x: number) {   // SCORM 1.2
        return this.GetErrorString(x)
    }
    GetErrorString(errcode: number) {  // SCORM 2004 2nd Edition
        return this.lastErrString
    }


    // for now, GetDiagnostic() is identical to GetErrorString()
    LMSGetDiagnostic(x: number) {   // SCORM 1.2
        return this.GetDiagnostic(x)
    }
    GetDiagnostic(errCode: number) {    // SCORM 2004 2nd Edition
        return this.lastErrString;
    }

}


