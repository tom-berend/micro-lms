// SCORM 1.2 Error Codes
//
// No error (0) No error occurred, the previous API call was successful.
// General Exception (101) No specific error code exists to describe the error. Use LMSGetDiagnostic for more information.
// Invalid argument error (201) Indicates that an argument represents an invalid data model element or is otherwise incorrect.
// Not initialized (301) Indicates that an API call was made before the call to LMSInitialize.
// Not implemented error (401) The data model element indicated in a call to LMSGetValue or LMSSetValue is valid, but was not implemented by this LMS. SCORM 1.2 defines a set of data model elements as being optional for an LMS to implement.
// Invalid set value, element is a keyword (402) Indicates that LMSSetValue was called on a data model element that represents a keyword (elements that end in “_children” and “_count”).
// Element is read only. (403) LMSSetValue was called with a data model element that can only be read.
// Element is write only (404) LMSGetValue was called on a data model element that can only be written to.
// Incorrect Data Type (405) LMSSetValue was called with a value that is not consistent with the data format of the supplied data model element.


export let errString = new Map()



// // note, these two errors were in SCORM 1.2, do not seem to be in 2004
// export const ERR = {
//     ElementCannotHaveChildren: 202,
//     ElementIsNotAnArray: 203,
// }
// Element cannot have children (202) Indicates that LMSGetValue was called with a data model element name that ends in “_children” for a data model element that does not support the “_children” suffix.
// Element not an array. Cannot have count. (203) Indicates that LMSGetValue was called with a data model element name that ends in “_count” for a data model element that does not support the “_count” suffix.



// 2004 Error Codes
export const ERR = {
NoError: 0,
GeneralException: 101,
GeneralInitializationFailure: 102,
AlreadyInitialized: 103,
ContentInstanceTerminated: 104,
GeneralTerminationFailure: 111,
TerminationBeforeInitialization: 112,
TerminationAfterTermination: 113,
RetrieveDataBeforeInitialization: 122,
RetrieveDataAfterTermination: 123,
StoreDataBeforeInitialization: 132,
StoreDataAfterTermination: 133,
CommitBeforeInitialization: 142,
CommitAfterTermination: 143,
GeneralArgumentError: 201,
GeneralGetFailure: 301,
GeneralSetFailure: 351,
GeneralCommitFailure: 391,
UndefinedDataModelElement: 401,
UnimplementedDataModelElement: 402,
DataModelElementValueNotInitialized: 403,
DataModelElementIsReadOnly: 404,
DataModelElementIsWriteOnly: 405,
DataModelElementTypeMismatch: 406,
DataModelElementValueOutOfRange: 407,
DataModelDependencyNotEstablished: 408,

}
// 2004 Error Codes
errString.set(0, "No error occurred, the previous API call was successful.")
errString.set(101, "No specific error code exists to describe the error. Use GetDiagnostic for more information.")
errString.set(102, "Call to Initialize failed for an unknown reason.")
errString.set(103, "Call to Initialize failed because Initialize was already called.")
errString.set(104, "Call to Initialize failed because Terminate was already called.")
errString.set(111, "Call to Terminate failed for an unknown reason.")
errString.set(112, "Call to Terminate failed because it was made before the call to Initialize.")
errString.set(113, "Call to Terminate failed because Terminate was already called.")
errString.set(122, "Call to GetValue failed because it was made before the call to Initialize.")
errString.set(123, "Call to GetValue failed because it was made after the call to Terminate.")
errString.set(132, "Call to SetValue failed because it was made before the call to Initialize.")
errString.set(133, "Call to SetValue failed because it was made after the call to Terminate.")
errString.set(142, "Call to Commit failed because it was made before the call to Initialize.")
errString.set(143, "Call to Commit failed because it was made after the call to Terminate.")
errString.set(201, "An invalid argument was passed to an API method (usually indicates that Initialize, Commit or Terminate did not receive the expected empty string argument.")
errString.set(301, "Indicates a failed GetValue call where no other specific error code is applicable. Use GetDiagnostic for more information.")
errString.set(351, "Indicates a failed SetValue call where no other specific error code is applicable. Use GetDiagnostic for more information.")
errString.set(391, "Indicates a failed Commit call where no other specific error code is applicable. Use GetDiagnostic for more information.")
errString.set(401, "The data model element name passed to GetValue or SetValue is not a valid SCORM data model element.")
errString.set(402, "The data model element indicated in a call to GetValue or SetValue is valid, but was not implemented by this LMS. In SCORM 2004, this error would indicate an LMS that is not fully SCORM conformant.")
errString.set(403, "Attempt to read a data model element that has not been initialized by the LMS or through a SetValue call. This error condition is often reached during normal execution of a SCO.")
errString.set(404, "SetValue was called with a data model element that can only be read.")
errString.set(405, "GetValue was called on a data model element that can only be written to.")
errString.set(406, "SetValue was called with a value that is not consistent with the data format of the supplied data model element.")
errString.set(407, "The numeric value supplied to a SetValue call is outside of the numeric range allowed for the supplied data model element.")
errString.set(408, "Some data model elements cannot be set until another data model element was set. This error condition indicates that the prerequisite element was not set before the dependent element.")
