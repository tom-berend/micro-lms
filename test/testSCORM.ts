import { Scorm, toSCORMBoolean } from '../src/scormAPI'
import { LMSAPI } from '../src/lmsapi'
import {ERR} from '../src/defines'


// we SHOULD test this separately
import { MicroLMS } from '../src/microlms'


// there are THREE programs to test
//    MicroLMS
//    SCORM wrapper 
//    LMSAPI


describe('test Scorm.toBoolean()', function () {
    it('test toBoolean', function () {

        expect(toSCORMBoolean('true')).toBe('true')
        expect(toSCORMBoolean('false')).toBe('false')

        expect(toSCORMBoolean('true')).toBe('true')
        expect(toSCORMBoolean('false')).toBe('false')

        expect(toSCORMBoolean(1)).toBe('true')
        expect(toSCORMBoolean(0)).toBe('false')

        expect(toSCORMBoolean('1')).toBe('true')
        expect(toSCORMBoolean('0')).toBe('false')

    });
});




describe('configure SCORM wrapper', function () {
    it('configure', function () {

        // don't use Scorm() directly in your SCORM course
        // always call LMSAPI, and let it call SCORM

        let scorm = new Scorm()
        expect(scorm.version).toBe('');
        expect(scorm.isActive).toBe(false);

        scorm.configure({ version: '1.2', debug: true })
        expect(scorm.version).toBe('1.2');
        expect(scorm.isActive).toBe(false);  // still false until initialized
    });


    //////////// MUST DISABLE 'RUN TESTS IN RANDOM ORDER' FOR THIS 
    // it('initialize before LMSAPI', function () {
    //     let scorm = new Scorm()

    //     scorm.configure({ version: '1.2', debug: true })
    //     let success = scorm.initialize()
    //     expect(success).toBe(false)
    // });

    it('initialize after LMSAPI', function () {
        LMSAPI.attachLMSAPIToWindow()
        let scorm = new Scorm()
        scorm.configure({ version: '1.2', debug: true })

        let success = scorm.initialize()
        expect(success).toBe('true')
    });

});

describe('LMSAPI Initialize, Terminate, Commit', function () {
    it('Initialize and Terminate', function () {


    // SCORM 1.1 / SCORM 1.2
    //
    //  LMSInitialize( "" ) : bool
    //  LMSFinish( "" ) : bool
    //  LMSGetValue( element : CMIElement ) : string
    //  LMSSetValue( element : CMIElement, value : string) : string
    //  LMSCommit( "" ) : bool
    //  LMSGetLastError() : CMIErrorCode
    //  LMSGetErrorString( errorCode : CMIErrorCode ) : string
    //  LMSGetDiagnostic( errocCode : CMIErrorCode ) : string




        LMSAPI.attachLMSAPIToWindow()
        let scorm = new Scorm()

        expect(scorm.initialize()).toBeTrue
        expect(scorm.terminate()).toBeTrue

        expect(scorm.initialize()).toBeTrue     // initialize after terminate
        expect(scorm.initialize()).toBeFalse

    });
})



// try some basic gets and sets on MicroLMS through the wrapper and LMSAPI
// this is a high-level test, lots of stuff has to be working for this

describe('Simple reads and writes', function () {
    it('simple reads and writes', function () {
        LMSAPI.attachLMSAPIToWindow()
        let scorm = new Scorm()
        scorm.configure({ version: '1.2', debug: true })
        scorm.initialize()
        expect(scorm.isActive).toBe(true)

        expect(scorm.get('cmi.core.student_name')).toBe('Tom')
        expect(scorm.get('cmi.core.student_id')).toBe('123456')

        expect(scorm.set('cmi.core.student_id', 555)).toBe('false')   // can't set RO student id
        expect(scorm.get('cmi.core.student_id')).toBe('123456')    // so still should be 123456

        expect(scorm.get('cmi.core.lesson_location')).toBe('')     // not yet set
        expect(scorm.set('cmi.core.lesson_location', 'first')).toBe('true')   // set it 
        expect(scorm.get('cmi.core.lesson_location')).toBe('first')   // and pick it up again

        // expect(scorm.set('cmi.core.lesson_location', 123)).toBe('false')   // it's a string, not a number
        // expect(scorm.get('cmi.core.lesson_location')).toBe('first')   // make sure it wasn't changed

    })

    it('test the LMSAPI status function', function () {
        LMSAPI.attachLMSAPIToWindow()
        let scorm = new Scorm()
        scorm.configure({ version: '1.2', debug: true })
        scorm.initialize()
        expect(scorm.isActive).toBe(true)

        // “passed”, “completed”, “failed”, “incomplete”, “browsed”, “not attempted”, 

        // expect(scorm.get('cmi_lesson_status')).toBe('incomplete')

        // expect(scorm.status()).toBe('not attempted')
        // expect(scorm.status('passed')).toBeTrue()
        // expect(scorm.status()).toBe('passed')

    })
})



describe('test localstorage', function () {
    it('simple reads and writes, no LMS', function () {

        // write, read back
        localStorage.setItem('myCat', 'Tom');
        expect(localStorage.getItem('myCat')).toBe('Tom')

        // remove, read back
        localStorage.removeItem('myCat');
        expect(localStorage.getItem('myCat')).toBeNull()

        // write, clear, read back
        localStorage.setItem('myCat', 'Tom');
        localStorage.clear();
        expect(localStorage.getItem('myCat')).toBeNull()
    })
})



describe('ISO Date and CMI time Format', function () {
    it('format event time to ISO 8601', function () {

        const event = new Date('05 October 2011 14:48 UTC');

        // we can't guess the timezone that this will be running in, just use the leader
        let eventString = event.toString()  // 'Wed Oct 05 2011 10:48:00 GMT-0400 (Eastern Daylight Time)'
        // this is the same as you would get with Date()   or    new Date().toString()

        expect(eventString.substr(0, 24)).toBe('Wed Oct 05 2011 10:48:00')
        expect(event.toISOString()).toBe("2011-10-05T14:48:00.000Z")

        let iso = event.toISOString()
        let unixTimeStamp = Date.parse(iso)       // 1317826080000  
        expect(unixTimeStamp).toBe(1317826080000)   // we cheated, but it's a number

        // finally, here's our test....
        let lmsapi = new LMSAPI()
        let isoDate =  new Date(Date.now()).toISOString()  // '2021-04-30T21:38:08.331Z' or similar

        // this might fail if Date.Now() changes in the microsecond between two calls
        expect(lmsapi.isoDateNow()).toBe(isoDate)
    })

    it('test some numeric formats', function () {
        let lmsapi = new LMSAPI()

        expect(lmsapi.isNumeric('94')).toBeTrue()
        expect(lmsapi.isNumeric('923.21')).toBeTrue()
        expect(lmsapi.isNumeric('6876876')).toBeTrue()
        expect(lmsapi.isNumeric('.32')).toBeTrue()
        expect(lmsapi.isNumeric('-894')).toBeTrue()
        expect(lmsapi.isNumeric('923.21')).toBeTrue()
        expect(lmsapi.isNumeric('-76876876')).toBeTrue()
        expect(lmsapi.isNumeric('-.32')).toBeTrue()

        expect(lmsapi.isNumeric('hello')).toBeFalse()
        expect(lmsapi.isNumeric('9bye')).toBeFalse()
        expect(lmsapi.isNumeric('hello9bye')).toBeFalse()
        expect(lmsapi.isNumeric('888,323')).toBeFalse()
        expect(lmsapi.isNumeric('5,434.3')).toBeFalse()
        expect(lmsapi.isNumeric('-8,336.09')).toBeFalse()
        expect(lmsapi.isNumeric('87078.')).toBeFalse()
    })

})


// this follows the Runtime Manual

////////////////////////////////////////////////////////////////////
/////////////  3.1.3 Session Methods
////////////////////////////////////////////////////////////////////


describe('Session Methods', function () {
    it('Initialize() and Terminate()', function () {

        let lmsapi = new LMSAPI()
       
        expect (lmsapi.Terminate("")).toBe('false')  // can't terminate before initialize
        expect(lmsapi.GetLastError()).toBe(ERR.TerminationBeforeInitialization) 

        expect(lmsapi.Initialize("")).toBe('true')
        expect(lmsapi.GetLastError()).toBe(ERR.NoError) 
        expect(lmsapi.Initialize("")).toBe('false')  // fails second time
        expect(lmsapi.GetLastError()).toBe(ERR.AlreadyInitialized) 

        expect (lmsapi.Terminate("")).toBe('true')  // normal termination
        expect(lmsapi.Initialize("")).toBe('false')  // but can't initialize again
        expect(lmsapi.GetLastError()).toBe(ERR.ContentInstanceTerminated) 

        expect (lmsapi.Terminate("")).toBe('false')  // can't terminate after termination
        expect(lmsapi.GetLastError()).toBe(ERR.TerminationAfterTermination) 

    })

})


////////////////////////////////////////////////////////////////////
/////////////  3.1.4 Data-Transfer Methods
////////////////////////////////////////////////////////////////////

describe('Data-Transfer Methods', function () {
    it('GetValue() and SetValue()', function () {

        let lmsapi = new LMSAPI()
        expect(lmsapi.Initialize("")).toBe('true')

        // expect(lmsapi.GetValue('cmi.core.student_name')).toBe('Tom')

        // expect(lmsapi.GetValue('cmi.core.unknown_value')).toBe('')  // unknown
        // expect(lmsapi.GetLastError()).toBe(ERR.UndefinedDataModelElement) 
        expect(lmsapi.GetLastError()).toBe(ERR.NoError) 
        expect(lmsapi.GetValue('cmi.core.learner_preference.delivery_speed')).toBe('')  // not implemented
        expect(lmsapi.GetLastError()).toBe(ERR.UnimplementedDataModelElement) 

        // expect(lmsapi.GetValue('cmi.core.session_time')).toBe('')  // Write-Only
        // expect(lmsapi.GetLastError()).toBe(ERR.DataModelElementIsWriteOnly) 

    })

})
