// class is a blueprint to create object

class ApiError extends Error {
  // extends basicly extendes the common code of Error and add more for customization
  constructor(statusCode, message = "something went wrong", errors = []) {
    super(message); // get the parent contructor (Error) -- data
    this.statusCode = statusCode;
    this.data = null; /////////////
    this.message = message;
    this.success = false;
    this.errors = errors;
  }
}

export {ApiError};
