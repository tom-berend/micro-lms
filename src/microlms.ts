
import { ERR, DataElement, DataModelElementGroup } from './defines'
import { DME_Core } from './DMECore'

//  https://adlnet.gov/projects/scorm-2004-4th-edition/



// for a real LMS, add 'courseID' (Math101), 'moduleID'(week01), 'semesterID'(fall2021), and 'classID'(SectionA)
// add a key for each.  if finer queries are needed, dump into a query database

// this record gets updated here, and written after each commit, there is only one record per moduleID in MicroLMS
export type studentRecord = {
    // core fields
    cmi_core_student_id: string,
    cmi_core_student_name: string,
    cmi_core_lesson_location: string,
    cmi_core_lesson_status: string,
    cmi_core_total_time: string,      // Initially is "0000:00:00.00" -
    cmi_core_credit: string,

    start_time: string,                    // ISO   event.toISOString()    2011-10-05T14:48:00.000Z
    cmi_session_time: string,          //"0000:00:00.00"
    cmi_comments_from_lms: string[],  // what has student been doing
    cmi_core_exit: string,            // 'time-out', 'suspend', 'logout, ''


}

function studentRecordFactory(id: string, s_name: string): studentRecord {
    let a: studentRecord =
    {
        cmi_core_student_id: id,
        cmi_core_student_name: s_name,
        cmi_core_lesson_location: '',
        cmi_core_lesson_status: 'not attempted',
        cmi_core_total_time: "0000:00:00.00",      // Initially is "0000:00:00.00" -
        cmi_core_credit: 'false',
        //sessions: []

        start_time: '',                   // ISO   event.toISOString()    2011-10-05T14:48:00.000Z
        cmi_session_time: '',          //"0000:00:00.00"
        cmi_comments_from_lms: [],  // what has student been doing
        cmi_core_exit: '',            // 'time-out', 'suspend', 'logout, ''

    }
    return a
}



export class MicroLMS {


    // stuff the LMS knows before starting
    moduleName = "Hello World"
    student_name = 'Tom'
    student_id = '123456'

    studentRecord: studentRecord

    dataModel: DataElement[] = []

    // cmiFamilies: object


    constructor() {
        // this.setUpDataModel()

        // test localStorage
        localStorage.setItem('testStorage', 'abc')
        console.assert(localStorage.getItem('testStorage') == 'abc', 'Localstorage is not available')

        // normally an LMS would already have registered the student and course, but maybe not here
        let x: string | null = localStorage.getItem(this.moduleName)
        if (x === null) {
            this.studentRecord = studentRecordFactory(this.student_id, this.student_name)
        } else {
            this.studentRecord = JSON.parse(x) as studentRecord
        }

        // this.cmiFamilies = {
        //     'core': new DME_Core(this)
        //     // 'objectives',
        //     // 'student_data',
        //     // 'student_preference',
        //     // 'interactions',
        //     // 'comments_from_learner',
        //     // 'learner_preference',
        //     // 'objectives',
        //     // 'score',
        // }


    }


    /** LMS writes data out to localstorage */
    commit() {
        localStorage.setItem(this.moduleName, JSON.stringify(this.studentRecord))
    }




    clearData() {
        ['exit', 'success_status', 'completion_status', 'interactions'].forEach(window.localStorage.removeItem.bind(window.localStorage));
        window.localStorage.setItem('total_time', '');
    }



    getDataElementGroup(path: string): DataModelElementGroup {
        switch (path) {
            case 'core': return new DME_Core(this); break;
            // case 'objectives': return new DME_Objectives(); break;
            // case 'student_data': return new DME_Student_data(); break;
            // case 'student_preference': return new DME_Student_preference(); break;
            // case 'interactions': return new DME_Interactions(); break;
            // case 'comments_from_learner': return new DME_Comments_from_learner(); break;
            // case 'learner_preference': return new DME_Learner_preference(); break;
            // case 'objectives': return new DME_Objectives(); break;
            // case 'score': return new DME_Score(); break;

            default:
                return new DME_EverythingElse(this)
        }
    }


    //** LMS is queried for a value, returns [string,error#] */
    dmGetValue(path: string): [string, number] {
        // console.log('%cdmGetValue', 'background-color:green;', path)

        let aPath = path.split('.')     // cmi.core.something  

        if (aPath.length < 2)          // has to be at least two elements
            return ['', ERR.GeneralArgumentError]

        if (aPath[0] == 'cmi') {
            // DME is an object that does the work, eg: DME_Core()  DME_Objectives
            let aPath1 = aPath[1]   // 'core'  or...
            let DME = this.getDataElementGroup(aPath1)
            // console.log('%cdmGetValue', 'background-color:blue;', DME, DME.get(path))
            let [value,error] = DME.get(path)
            // console.log('%cdmGetValue', 'background-color:lightblue;',`'${value}','${error}'`)
            return [value,error]
        }
        return ['', ERR.UnimplementedDataModelElement]   // ADL commands not implemented yet
    }

    //** LMS receives a value, returns error (hopefully ERR.NoError) */
    dmSetValue(path: string, value: string): number {
        let aPath = path.split('.')     // cmi.core.something  

        if (aPath.length < 2)          // has to be at least two elements
            return ERR.GeneralArgumentError

        if (aPath[0] == 'cmi') {
            // DME is an object that does the work, eg: DME_Core()  DME_Objectives
            let DME = this.getDataElementGroup(aPath[1])
            let error = DME.set(value, path)  // NOTE:  (value,path)  !!!!
            return error
        }
        return ERR.UnimplementedDataModelElement   // ADL commands not implemented yet
    }

}








class DMEExample implements DataModelElementGroup {

    isValid(path: string): boolean {   // do we own it?
        return false
    }
    isImplemented(path: string): boolean {  // have we implemented it?
        return false
    }

    get(path: string): [string, number] {   // returns [value,error]
        return ['', ERR.AlreadyInitialized]
    }

    set(value: string, path: string, n?: number, element?: string): number {   // returns error
        return ERR.AlreadyInitialized
    }
}

class DME_EverythingElse implements DataModelElementGroup {

    constructor(microlms: MicroLMS) { }

    isValid(path: string): boolean {   // do we own it?
        return false
    }
    isImplemented(path: string): boolean {  // have we implemented it?
        return false
    }

    get(path: string): [string, number] {   // returns [value,error]
        return ['', ERR.AlreadyInitialized]
    }

    set(value: string, path: string, n?: number, element?: string): number {   // returns error
        return ERR.AlreadyInitialized
    }
}







////////////////////////////// set up data model


// Data Model SCORM 1.2


// cmi.suspend_data (CMIString (SPM: 4096), RW) Provides space to store and retrieve data between learner sessions
// cmi.launch_data (CMIString (SPM: 4096), RO) Data provided to a SCO after launch, initialized from the dataFromLMS manifest element
// cmi.comments (CMIString (SPM: 4096), RW) Textual input from the learner about the SCO
// cmi.comments_from_lms (CMIString (SPM: 4096), RO) Comments or annotations associated with a SCO

// cmi.objectives._children (id,score,status, RO) Listing of supported data model elements
// cmi.objectives._count (non-negative integer, RO) Current number of objectives being stored by the LMS
// cmi.objectives.n.id (CMIIdentifier, RW) Unique label for the objective
// cmi.objectives.n.score._children (raw,min,max, RO) Listing of supported data model elements
// cmi.objectives.n.score.raw (CMIDecimal, RW) Number that reflects the performance of the learner, for the objective, relative to the range bounded by the values of min and max
// cmi.objectives.n.score.max (CMIDecimal, Rw) Maximum value, for the objective, in the range for the raw score
// cmi.objectives.n.score.min (CMIDecimal, RW) Minimum value, for the objective, in the range for the raw score
// cmi.objectives.n.status (“passed”, “completed”, “failed”, “incomplete”, “browsed”, “not attempted”, RW) Indicates whether the learner has completed or satisfied the objective

// cmi.student_data._children (mastery_score, max_time_allowed, time_limit_action, RO) Listing of supported data model elements
// cmi.student_data.mastery_score (CMIDecimal, RO) Passing score required to master the SCO
// cmi.student_data.max_time_allowed (CMITimespan, RO) Amount of accumulated time the learner is allowed to use a SCO
// cmi.student_data.time_limit_action (exit,message,” “exit,no message”,” continue,message”, “continue, no message”, RO) Indicates what the SCO should do when max_time_allowed is exceeded
// cmi.student_preference._children (audio,language,speed,text, RO) Listing of supported data model elements
// cmi.student_preference.audio (CMISInteger, RW) Specifies an intended change in perceived audio level
// cmi.student_preference.language (CMIString (SPM: 255), RW) The student’s preferred language for SCOs with multilingual capability
// cmi.student_preference.speed (CMISInteger, RW) The learner’s preferred relative speed of content delivery
// cmi.student_preference.text (CMISInteger, RW) Specifies whether captioning text corresponding to audio is displayed

// cmi.interactions._children (id,objectives,time,type,correct_responses,weighting,student_response,result,latency, RO) Listing of supported data model elements
// cmi.interactions._count (CMIInteger, RO) Current number of interactions being stored by the LMS
// cmi.interactions.n.id (CMIIdentifier, WO) Unique label for the interaction
// cmi.interactions.n.objectives._count (CMIInteger, RO) Current number of objectives (i.e., objective identifiers) being stored by the LMS for this interaction
// cmi.interactions.n.objectives.n.id (CMIIdentifier, WO) Label for objectives associated with the interaction
// cmi.interactions.n.time (CMITime, WO) Point in time at which the interaction was first made available to the student for student interaction and response
// cmi.interactions.n.type (“true-false”, “choice”, “fill-in”, “matching”, “performance”, “sequencing”, “likert”, “numeric”, WO) Which type of interaction is recorded
// cmi.interactions.n.correct_responses._count (CMIInteger, RO) Current number of correct responses being stored by the LMS for this interaction
// cmi.interactions.n.correct_responses.n.pattern (format depends on interaction type, WO) One correct response pattern for the interaction
// cmi.interactions.n.weighting (CMIDecimal, WO) Weight given to the interaction relative to other interactions
// cmi.interactions.n.student_response (format depends on interaction type, WO) Data generated when a student responds to an interaction
// cmi.interactions.n.result (“correct”, “wrong”, “unanticipated”, “neutral”, “x.x [CMIDecimal]”, WO) Judgment of the correctness of the learner response
// cmi.interactions.n.latency (CMITimespan, WO) Time elapsed between the time the interaction was made available to the learner for response and the time of the first response




// Data Model SCORM 2004

// cmi._version (characterstring, RO) Represents the version of the data model

// cmi.comments_from_learner._children (comment,location,timestamp, RO) Listing of supported data model elements
// cmi.comments_from_learner._count (non-negative integer, RO) Current number of learner comments
// cmi.comments_from_learner.n.comment (localized_string_type (SPM: 4000), RW) Textual input
// cmi.comments_from_learner.n.location (characterstring (SPM: 250), RW) Point in the SCO to which the comment applies
// cmi.comments_from_learner.n.timestamp (time (second,10,0), RW) Point in time at which the comment was created or most recently changed

// cmi.comments_from_lms._children (comment,location,timestamp, RO) Listing of supported data model elements
// cmi.comments_from_lms._count (non-negative integer, RO) Current number of comments from the LMS
// cmi.comments_from_lms.n.comment (localized_string_type (SPM: 4000), RO) Comments or annotations associated with a SCO
// cmi.comments_from_lms.n.location (characterstring (SPM: 250), RO) Point in the SCO to which the comment applies
// cmi.comments_from_lms.n.timestamp (time(second,10,0), RO) Point in time at which the comment was created or most recently changed

// cmi.completion_status (“completed”, “incomplete”, “not attempted”, “unknown”, RW) Indicates whether the learner has completed the SCO
// cmi.completion_threshold (real(10,7) range (0..1), RO) Used to determine whether the SCO should be considered complete
// cmi.credit (“credit”, “no-credit”, RO) Indicates whether the learner will be credited for performance in the SCO
// cmi.entry (ab_initio, resume, “”, RO) Asserts whether the learner has previously accessed the SCO
// cmi.exit (timeout, suspend, logout, normal, “”, WO) Indicates how or why the learner left the SCO

// cmi.interactions._children (id,type,objectives,timestamp,correct_responses,weighting,learner_response,result,latency,description, RO) Listing of supported data model elements
// cmi.interactions._count (non-negative integer, RO) Current number of interactions being stored by the LMS
// cmi.interactions.n.id (long_identifier_type (SPM: 4000), RW) Unique label for the interaction
// cmi.interactions.n.type (“true-false”, “choice”, “fill-in”, “long-fill-in”, “matching”, “performance”, “sequencing”, “likert”, “numeric” or “other”, RW) Which type of interaction is recorded
// cmi.interactions.n.objectives._count (non-negative integer, RO) Current number of objectives (i.e., objective identifiers) being stored by the LMS for this interaction
// cmi.interactions.n.objectives.n.id (long_identifier_type (SPM: 4000), RW) Label for objectives associated with the interaction
// cmi.interactions.n.timestamp (time(second,10,0), RW) Point in time at which the interaction was first made available to the learner for learner interaction and response
// cmi.interactions.n.correct_responses._count (non-negative integer, RO) Current number of correct responses being stored by the LMS for this interaction
// cmi.interactions.n.correct_responses.n.pattern (format depends on interaction type, RW) One correct response pattern for the interaction
// cmi.interactions.n.weighting (real (10,7), RW) Weight given to the interaction relative to other interactions
// cmi.interactions.n.learner_response (format depends on interaction type, RW) Data generated when a learner responds to an interaction
// cmi.interactions.n.result (“correct”, “incorrect”, “unanticipated”, “neutral”) or a real number with values that is accurate to seven significant decimal figures real. , RW) Judgment of the correctness of the learner response
// cmi.interactions.n.latency (timeinterval (second,10,2), RW) Time elapsed between the time the interaction was made available to the learner for response and the time of the first response
// cmi.interactions.n.description (localized_string_type (SPM: 250), RW) Brief informative description of the interaction

// cmi.launch_data (characterstring (SPM: 4000), RO) Data provided to a SCO after launch, initialized from the dataFromLMS manifest element
// cmi.learner_id (long_identifier_type (SPM: 4000), RO) Identifies the learner on behalf of whom the SCO was launched
// cmi.learner_name (localized_string_type (SPM: 250), RO) Name provided for the learner by the LMS

// cmi.learner_preference._children (audio_level,language,delivery_speed,audio_captioning, RO) Listing of supported data model elements
// cmi.learner_preference.audio_level (real(10,7), range (0..*), RW) Specifies an intended change in perceived audio level
// cmi.learner_preference.language (language_type (SPM 250), RW) The learner’s preferred language for SCOs with multilingual capability
// cmi.learner_preference.delivery_speed (real(10,7), range (0..*), RW) The learner’s preferred relative speed of content delivery
// cmi.learner_preference.audio_captioning (“-1”, “0”, “1”, RW) Specifies whether captioning text corresponding to audio is displayed

// cmi.location (characterstring (SPM: 1000), RW) The learner’s current location in the SCO
// cmi.max_time_allowed (timeinterval (second,10,2), RO) Amount of accumulated time the learner is allowed to use a SCO
// cmi.mode (“browse”, “normal”, “review”, RO) Identifies one of three possible modes in which the SCO may be presented to the learner

// cmi.objectives._children (id,score,success_status,completion_status,description, RO) Listing of supported data model elements
// cmi.objectives._count (non-negative integer, RO) Current number of objectives being stored by the LMS
// cmi.objectives.n.id (long_identifier_type (SPM: 4000), RW) Unique label for the objective
// cmi.objectives.n.score._children (scaled,raw,min,max, RO) Listing of supported data model elements
// cmi.objectives.n.score.scaled (real (10,7) range (-1..1), RW) Number that reflects the performance of the learner for the objective
// cmi.objectives.n.score.raw (real (10,7), RW) Number that reflects the performance of the learner, for the objective, relative to the range bounded by the values of min and max
// cmi.objectives.n.score.min (real (10,7), RW) Minimum value, for the objective, in the range for the raw score
// cmi.objectives.n.score.max (real (10,7), RW) Maximum value, for the objective, in the range for the raw score
// cmi.objectives.n.success_status (“passed”, “failed”, “unknown”, RW) Indicates whether the learner has mastered the objective
// cmi.objectives.n.completion_status (“completed”, “incomplete”, “not attempted”, “unknown”, RW) Indicates whether the learner has completed the associated objective
// cmi.objectives.n.progress_measure (real (10,7) range (0..1), RW) Measure of the progress the learner has made toward completing the objective
// cmi.objectives.n.description (localized_string_type (SPM: 250), RW) Provides a brief informative description of the objective

// cmi.progress_measure (real (10,7) range (0..1), RW) Measure of the progress the learner has made toward completing the SCO
// cmi.scaled_passing_score (real(10,7) range (-1 .. 1), RO) Scaled passing score required to master the SCO

// cmi.score._children (scaled,raw,min,max, RO) Listing of supported data model elements
// cmi.score.scaled (real (10,7) range (-1..1), RW) Number that reflects the performance of the learner
// cmi.score.raw (real (10,7), RW) Number that reflects the performance of the learner relative to the range bounded by the values of min and max
// cmi.score.min (real (10,7), RW) Minimum value in the range for the raw score
// cmi.score.max (real (10,7), RW) Maximum value in the range for the raw score

// cmi.session_time (timeinterval (second,10,2), WO) Amount of time that the learner has spent in the current learner session for this SCO
// cmi.success_status (“passed”, “failed”, “unknown”, RW) Indicates whether the learner has mastered the SCO
// cmi.suspend_data (characterstring (SPM: 64000), RW) Provides space to store and retrieve data between learner sessions
// cmi.time_limit_action (“exit,message”, “continue,message”, “exit,no message”, “continue,no message”, RO) Indicates what the SCO should do when cmi.max_time_allowed is exceeded
// cmi.total_time (timeinterval (second,10,2), RO) Sum of all of the learner’s session times accumulated in the current learner attempt

// adl.nav.request (request(continue, previous, choice, jump, exit, exitAll, abandon, abandonAll, suspendAll _none_), RW) Navigation request to be processed immediately following Terminate()
// adl.nav.request_valid.continue (state (true, false, unknown), RO) Used by a SCO to determine if a Continue navigation request will succeed.
// adl.nav.request_valid.previous (state (true, false, unknown), RO) Used by a SCO to determine if a Previous navigation request will succeed.
// adl.nav.request_valid.choice.{target=} (state (true, false, unknown), RO) Used by a SCO to determine if a Choice navigation request for the target activity will succeed.
// adl.nav.request_valid.jump.{target=} (state (true, false, unknown), RO) Used by a SCO to determine if a Jump navigation request for the target activity will succeed.




