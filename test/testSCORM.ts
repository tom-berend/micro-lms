import { Scorm, toBoolean } from '../src/scormAPI'
import { LMSAPI } from '../src/lmsapi'


// we SHOULD test this separately
import { MicroLMS } from '../src/microlms'


// there are THREE programs to test
//    MicroLMS
//    SCORM wrapper 
//    LMSAPI


describe('test Scorm.toBoolean()', function () {
    it('test toBoolean', function () {

        expect(toBoolean('true')).toBeTrue()
        expect(toBoolean('false')).toBeFalse()

        expect(toBoolean('True')).toBeTrue()
        expect(toBoolean('False')).toBeFalse()

        expect(toBoolean(1)).toBeTrue()
        expect(toBoolean(0)).toBeFalse()

        expect(toBoolean('1')).toBeTrue()
        expect(toBoolean('0')).toBeFalse()

    });
});




describe('configure SCORM wrapper', function () {
    it('configure', function () {
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
        expect(success).toBe(true)
    });

});

describe('LMSAPI Initialize, Terminate, Commit', function () {

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



    it('Initialize and Terminate', function () {
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

        expect(scorm.set('cmi.core.student_id', 555)).toBeFalse()   // can't set RO student id
        expect(scorm.get('cmi.core.student_id')).toBe('123456')    // so still should be 123456

        expect(scorm.get('cmi.core.lesson_location')).toBe('')     // not yet set
        expect(scorm.set('cmi.core.lesson_location', 'first')).toBeTrue()   // set it 
        expect(scorm.get('cmi.core.lesson_location')).toBe('first')   // and pick it up again

        expect(scorm.set('cmi.core.lesson_location', 123)).toBeFalse()   // it's a string, not a number
        expect(scorm.get('cmi.core.lesson_location')).toBe('first')   // make sure it wasn't changed

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


