import { ERR, DataElement, DataModelElementGroup } from './defines'
import { MicroLMS } from './microlms'



// Data Model SCORM 1.2

// cmi.core._children (student_id, student_name, lesson_location, credit, lesson_status, entry, score, total_time, lesson_mode, exit, session_time, RO) Listing of supported data model elements
// cmi.core.student_id (CMIString (SPM: 255), RO) Identifies the student on behalf of whom the SCO was launched
// cmi.core.student_name (CMIString (SPM: 255), RO) Name provided for the student by the LMS
// cmi.core.lesson_location (CMIString (SPM: 255), RW) The learner’s current location in the SCO
// cmi.core.credit (“credit”, “no-credit”, RO) Indicates whether the learner will be credited for performance in the SCO
// cmi.core.lesson_status (“passed”, “completed”, “failed”, “incomplete”, “browsed”, “not attempted”, RW) Indicates whether the learner has completed and satisfied the requirements for the SCO
// cmi.core.entry (“ab-initio”, “resume”, “”, RO) Asserts whether the learner has previously accessed the SCO
// cmi.core.score_children (raw,min,max, RO) Listing of supported data model elements
// cmi.core.score.raw (CMIDecimal, RW) Number that reflects the performance of the learner relative to the range bounded by the values of min and max
// cmi.core.score.max (CMIDecimal, RW) Maximum value in the range for the raw score
// cmi.core.score.min (CMIDecimal, RW) Minimum value in the range for the raw score
// cmi.core.total_time (CMITimespan, RO) Sum of all of the learner’s session times accumulated in the current learner attempt
// cmi.core.lesson_mode (“browse”, “normal”, “review”, RO) Identifies one of three possible modes in which the SCO may be presented to the learner
// cmi.core.exit (“time-out”, “suspend”, “logout”, “”, WO) Indicates how or why the learner left the SCO
// cmi.core.session_time (CMITimespan, WO) Amount of time that the learner has spent in the current learner session for this SCO




export class DME_Core implements DataModelElementGroup {

    static dataElements: DataElement[] = []   // jdon't need to load this every time

    microLMS: MicroLMS

    constructor(microLMS: MicroLMS) {
        this.microLMS = microLMS

        if (DME_Core.dataElements.length == 0) {
            this.setup()        // setup the static arrary if not already done
        }
    }


    get(path: string): [string, number] {   // returns [value,error]
        // console.log('%cdmGetValue','background-color:yellow;',path)

        let dm = DME_Core.dataElements.find((element) => element.path == path)

        if (dm === undefined) {       // can't find that path (cmi.something_weird)
            return ['', ERR.UndefinedDataModelElement]
        }

        if (dm.access == 'WO') {        // can't read that path
            return ['', ERR.DataModelElementIsWriteOnly]
        }

        if (dm.access == '**') {        // can't read that path
            return ['', ERR.UnimplementedDataModelElement]
        }

        return [dm.get(),ERR.NoError]
    }


    set(value: string, path: string, n?: number, element?: string): number {   // returns error
        // console.log('%cdmSetValue', 'background-color:yellow;', `'${value}','${path}'`)
        let dm = DME_Core.dataElements.find((element) => element.path == path)
        // console.log('Valid for set', this.dataModel, path, dm)

        if (dm === undefined) {       // can't find that path (cmi.something_weird)
            return ERR.UndefinedDataModelElement
        }

        if (dm.access == 'RO') {        // can't write that path
            return ERR.DataModelElementIsReadOnly
        }

        if (dm.access == '**') {        // can't write that path
            return  ERR.UnimplementedDataModelElement
        }

        let valid = dm.validate(path)
        if (valid !== ERR.NoError) {
            return valid
        }
        dm.set(value)
        return (ERR.NoError)

    }


    /////////////////////////////////////
    /////////////////////////////////////

    dataModelFactory(
        path: string,
        access: 'RO' | 'RW' | 'WO' | '**',   // '**' means unimplemented, never sent it back
        validate: <T = string>(value: T) => number,    // number is an error code
        get: Function,
        set: Function
    ) {
        DME_Core.dataElements.push({ path: path, access: access, validate: validate, get: get, set: set })
    }





    setup() {

        // in case we get called twice 
        console.assert(DME_Core.dataElements.length == 0)  // shouldn't be here twice
        DME_Core.dataElements = []     // array of {name, access, validate, get, set}  from dataModelFactory



        this.dataModelFactory(  // cmi.core._children (student_id, student_name, lesson_location, credit, lesson_status, entry, score, total_time, lesson_mode, exit, session_time, RO) Listing of supported data model elements
            'cmi.core._children',
            'RO',
            (value: any) => ERR.NoError,
            () => true,
            (value: any) => true,
        )

        this.dataModelFactory( // cmi.core.student_id (CMIString (SPM: 255) RO) Identifies the student on behalf of whom the SCO was launched
            'cmi.core.student_id',
            'RO',
            (value: any) => (typeof value == 'string') ? ERR.NoError : ERR.DataModelElementTypeMismatch,
            () => this.microLMS.studentRecord.cmi_core_student_id,
            (value: any) => false,
        )

        this.dataModelFactory( // cmi.core.student_name (CMIString (SPM: 255) RO) Name provided for the student by the LMS
            'cmi.core.student_name',
            'RO',
            (value: any) => (typeof value == 'string') ? ERR.NoError : ERR.DataModelElementTypeMismatch,
            () => this.microLMS.studentRecord.cmi_core_student_name,
            (value: any) => false,
        )

        this.dataModelFactory( // cmi.core.lesson_location (CMIString (SPM: 255) RW) The learner’s current location in the SCO
            'cmi.core.lesson_location',
            'RW',
            (value: any) => (typeof value == 'string') ? ERR.NoError : ERR.DataModelElementTypeMismatch,
            () => {
                // console.log(`just returned lesson_location '${this.microLMS.studentRecord.cmi_core_lesson_location}'`)
                return this.microLMS.studentRecord.cmi_core_lesson_location
            },
            (value: any) => {
                this.microLMS.studentRecord.cmi_core_lesson_location = value
                // console.log('just set lesson location to ', value)
            },
        )

        this.dataModelFactory( // cmi.core.credit (“credit”, “no-credit”, RO) Indicates whether the learner will be credited for performance in the SCO
            'cmi.core.credit',
            'RO',
            (value: any) => ERR.DataModelElementIsReadOnly, // ["credit", "no-credit"]
            (value: any) => true,
            (value: any) => true,
        )

        this.dataModelFactory( // cmi.core.lesson_status (“passed”, “completed”, “failed”, “incomplete”, “browsed”, “not attempted”, RW) Indicates whether the learner has completed and satisfied the requirements for the SCO
            'cmi.core.lesson_status',
            'RW',
            (value: any) => ["passed", "completed", "failed", "incomplete", "browsed", "not attempted"].includes(value) ? ERR.NoError : ERR.DataModelElementValueOutOfRange,
            (value: any) => { this.microLMS.studentRecord.cmi_core_lesson_status },
            (value: any) => { this.microLMS.studentRecord.cmi_core_lesson_status = value }
        )

        //  https://support.scorm.com/hc/en-us/articles/206166706-Separating-failed-from-complete-

        // SCORM 2004 uses TWO fields, completion_status and success_status
        // completed
        // incomplete
        // not attempted
        // unknown

        // passed
        // failed
        // unknown

        // 1.2 is confused on this.   

        this.dataModelFactory( // cmi.core.entry (“ab-initio”, “resume”, “”, RO) Asserts whether the learner has previously accessed the SCO
            'cmi.core.entry',
            'RO',
            (value: any) => ERR.DataModelElementIsReadOnly, // ["ab-initio", "resume", ""]
            (value: any) => true,
            (value: any) => true,
        )

        this.dataModelFactory( // cmi.core.score_children (raw,min,max, RO) Listing of supported data model elements
            'cmi.core.score_children',
            'RO',
            (value: any) => ERR.DataModelElementIsReadOnly,
            (value: any) => true,
            (value: any) => true,
        )

        this.dataModelFactory( // cmi.core.score.raw (CMIDecimal, RW) Number that reflects the performance of the learner relative to the range bounded by the values of min and max
            'cmi.core.score.raw',
            'RW',
            (value: any) => typeof value == 'number' ? ERR.NoError : ERR.DataModelElementTypeMismatch,
            (value: any) => true,
            (value: any) => true,
        )

        // this.dataModelFactory( // cmi.core.score.max (CMIDecimal, RW) Maximum value in the range for the raw score
        //     'cmi.core.score.max',
        //     'RW',
        //     (value: any) => typeof value == 'number' ? ERR.NoError : ERR.InvalidArgument,
        //     (value: any) => true,
        //     (value: any) => true,
        // )

        this.dataModelFactory( // cmi.core.score.min (CMIDecimal, RW) Minimum value in the range for the raw score
            'cmi.core.score.min',
            'RW',
            (value: any) => typeof value == 'number' ? ERR.NoError : ERR.DataModelElementTypeMismatch,
            (value: any) => true,
            (value: any) => true,
        )

        this.dataModelFactory( // cmi.core.total_time (CMITimespan, RO) Sum of all of the learner’s session times accumulated in the current learner attempt
            'cmi.core.total_time',
            'RO',
            (value: any) => ERR.DataModelElementIsReadOnly,
            (value: any) => true,
            (value: any) => true,
        )

        this.dataModelFactory( // cmi.core.lesson_mode (“browse”, “normal”, “review”, RO) Identifies one of three possible modes in which the SCO may be presented to the learner
            'cmi.core.lesson_mode',
            'RO',
            (value: any) => ERR.DataModelElementIsReadOnly, // ["browse", "normal", "review"]
            (value: any) => true,
            (value: any) => true,
        )

        this.dataModelFactory( // cmi.core.exit (“time-out”, “suspend”, “logout”, “”, WO) Indicates how or why the learner left the SCO
            'cmi.core.exit',
            'WO',
            (value: any) => ["time-out", "suspend", "logout", ""].includes(value) ? ERR.NoError : ERR.DataModelElementValueOutOfRange,
            (value: any) => true,
            (value: any) => true,
        )

        this.dataModelFactory( // cmi.core.session_time (CMITimespan, WO) Amount of time that the learner has spent in the current learner session for this SCO
            'cmi.core.session_time',
            'WO',
            (value: any) => true ? ERR.NoError : ERR.GeneralArgumentError,
            (value: any) => true,
            (value: any) => true,
        )


        // example of an unimplemented data value  (validate returns ERR.Unimplemented)
        this.dataModelFactory( // 
            'cmi.core.learner_preference.delivery_speed',
            '**',
            (value: any) => ERR.NoError,
            (value: any) => false,
            (value: any) => false,
        )


    }
}
