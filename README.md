# micro-lms
Middleware for SCORM 2004, for writing SCORM courses OR a backend LMS. No dependencies.

## THIS IS A WORK IN PROGRESS

There are three components in this package.

* microLMS - provides a simple LMS with one student and one module, using localstorage.  If you need to build an LMS, look at how this one works.
 
* scormAPI - this is the module that your course should talk to.  It has the SCORM function: initialize(), terminate(), get(), set(), commit(), status(), and getLastError().

* lmsAPI - Something like this will be installed in the browser window to allow the scormAPI to talk to the LMS.



To understand how to make your educational package talk via SCORM, work through the Jasmine test file.  Then keep watching the console log as you develop and test your package.



