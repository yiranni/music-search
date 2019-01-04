// //Custom code validation matchers (for error output)
const ESLintEngine = require("eslint").CLIEngine;

module.exports = {
  
    //takes in an array of sources and a configuration object for ESLint
    toHaveNoEsLintErrors(sourcesList, options){
      const linter = new ESLintEngine(options); //load the configuration
      let report = linter.executeOnFiles(sourcesList); //lint the sources
  
      const SEVERITY_MSG = {1:"Warn",2:"Error"}; //for printing
  
      //what to return
      const pass = report.errorCount === 0;
      if(pass){
        return { pass:true, message:() => "expected JavaScript to show linting errors" }; 
      }
      else {
        //doesn't seem to be handling multiple files correctly...
        return { pass: false, message:() => (
          //loop through and build the result string
          report.results.reduce((fout, fileMessages)=> {
            return (
              fileMessages.filePath + '\n' + 
              fileMessages.messages.reduce((out, msg) => {         
                return out + `    ${SEVERITY_MSG[msg.severity]}: ${msg.message} At line ${msg.line}, column ${msg.column}`+'\n';
              }, '')
            )
          }, '')
        )};      
      }
    },
  
    //using eslint
    htmlLintResultsContainsNoErrors(validityObj) {
      const pass = validityObj.length === 0;
      if(pass){
        return { pass:true, message:() => "expected html to contain validity errors" };  
      }
      else {
        return { pass: false, message:() => (
          //loop through and build the result string
          //these error messages could be more detailed; maybe do manually later
          validityObj.reduce((out, msg)=> {
            return out + `Error: '${msg.rule}' at line ${msg.line}, column ${msg.column}.\n`
          }, '')
        )};      
      }
    },
  
    //using stylelint errors
    cssLintResultsContainsNoErrors(validityObj) {
      const pass = validityObj.errored === false;
      if(pass){
        return { pass:true, message:() => "expected CSS to contain validity errors" };
      }
      else {
        return { pass: false, message:() => (
          //loop through and build the result string
          JSON.parse(validityObj.output)[0].warnings.reduce((out, msg) => {
            return out + `${msg.severity}: ${msg.text}\n       At line ${msg.line}, column ${msg.column}.\n`
          }, '')
        )};
      }
    }
  };