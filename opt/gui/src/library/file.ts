//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-start-orig/
//  Contact:    https://neatly.be/


// Imports: Default
import { HttpHeaders } from '@angular/common/http';

// Imports: Libraries
import * as objLib from '@library/object';


// Upload File
export function uploadFile(properties, property, files: FileList, fileData) {

  // Single File Only
  if (!property.accepted.multiple) {

    // Only One File Selected
    if (files.length == 1) {

      // Create Form Data
      let formData: FormData = new FormData();
      formData.append('file', files.item(0), files.item(0).name);
      fileData[property.property] = formData;

      // Assign File Name to Property Value
      properties.filter(obj => obj.property == property.property)[0].value = files.item(0).name;

    }

    // Multiple or No File Selected
    else { properties.filter(obj => obj.property == property.property)[0].value = ''; }

  }

}

// Generate File Path
export function genFilePath(property, value) {

  // Determine Download Path
  let downloadPath = ((objLib.lookUpKey(property, 'download') && objLib.lookUpKey(property.download, 'link'))?property.download.link:'assets/objects/');

  // Return Path
  return (downloadPath + value['reference']);

}

// Download File
export function downloadFile(property, value, cookieService, httpModule, snackBarService) {

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Configure JSON Return
  const httpOptions = {responseType: 'blob' as 'json', headers: headers}

  // Execute Download Automatically
  httpModule.get(genFilePath(property, value), httpOptions).subscribe(

    // Success
    (data) => {
      var link = document.createElement('a');
      link.href = window.URL.createObjectURL(data);
      link.download = value['name'];
      link.click();
    },

    // Fail
    err => { snackBarService.httpErrorOccurred(err); }

  );

}
