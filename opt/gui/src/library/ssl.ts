//  Author:     Thomas D'haenens
//  License:    GPL-3.0
//  Link:       https://github.com/BENEATLY/neat-start-orig/
//  Contact:    https://neatly.be/


// Imports: Default
import { HttpHeaders } from '@angular/common/http';

// Imports: Libraries
import * as rightLib from '@library/right';
import * as objLib from '@library/object';
import * as syncLib from '@library/sync';


// SSL Warning
export function sslWarning(sslInfo) {

  // Has SSL Info
  if (sslInfo) {

    // Determine Expiration Date
    let expirationDate = new Date(sslInfo['expiryDate'] + '+0000');

    // Determine Current Date
    let currentDate = new Date();

    // Calculate Days Before Expiration
    let daysToGo = (expirationDate.getTime() - currentDate.getTime())/(1000*60*60*24);

    // SSL Warning
    if (daysToGo < 14) { return true; }
    else { return false; }

  }

  // No SSL Info
  else { return false; }

}

// SSL Check
export async function sslCheck(config, userData, translate, httpModule, snackBarModule, cookieService, routerModule, position, noSnack = true) {

  // Administrator Only
  if (rightLib.sufficientRights(userData.right, 'Right', 'Edit', 'all')) {

    // Define API Authentication
    let token = cookieService.get('token');
    let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

    // Attempt to Get SSL Call
    try {

      // Get SSL Info
      let result = await httpModule.get(`${config['apiRootUrl']}ssl/info`, { headers }).toPromise().then(

        // Success
        res => { return res; },

        // Fail
        err => { console.log('SSL is not configured.'); }

      );

      // Determine Expiration Date
      let expirationDate = new Date(result['expiryDate'] + '+0000');

      // Determine Current Date
      let currentDate = new Date();

      // Calculate Days Before Expiration
      let daysToGo = (expirationDate.getTime() - currentDate.getTime())/(1000*60*60*24);

      // Trigger SSL Expire Soon Snackbar & Return SSL Info
      if ((daysToGo < 14) && (daysToGo > 0)) {
        if (!noSnack) { snackBarModule.sslExpireSoon(translate, routerModule, position); }
      }

      // Trigger SSL Expired SnackBar & Return SSL Info
      else if (daysToGo < 0) {
        if (!noSnack) { snackBarModule.sslExpired(translate, routerModule, position); }
      }

      // Return SSL Info
      return result;

    }

    // No SSL Info
    catch(e) {

      // Return Null
      return null;

    }

  }

  // Insufficient Rights
  else { return null; }

}

// Has Valid SSL
export function hasValidSSL(sslInfo) { return ((sslInfo != null) && (!objLib.isEmptyObject(sslInfo)) && objLib.lookUpKey(sslInfo, 'certificate') && sslInfo['certificate'] && objLib.lookUpKey(sslInfo, 'key') && sslInfo['key']); }

// Get Active API Protocol
export function getActiveAPIProtocol(config) { return config['apiRootUrl'].split('://')[0].toUpperCase(); }

// Get Available API Protocol
export function getAvailableAPIProtocol(config) {
  let currentProtocol = getActiveAPIProtocol(config);
  if (currentProtocol == 'HTTP') { return 'HTTPS'; }
  else { return 'HTTP'; }
}

// Get Active GUI Protocol
export function getActiveGUIProtocol(config) { return config['protocol'].toUpperCase(); }

// Get Available GUI Protocol
export function getAvailableGUIProtocol(config) {
  let currentProtocol = getActiveGUIProtocol(config);
  if (currentProtocol == 'HTTP') { return 'HTTPS'; }
  else { return 'HTTP'; }
}

// Upload Certificate File
export function uploadCertificateFile(files: FileList, config, snackBarService, cookieService, httpModule, updateRef) {

  // Only One File Selected
  if(files.length == 1) {

    // Define API Authentication
    let token = cookieService.get('token');
    let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

    // Create Form Data
    let formData: FormData = new FormData();
    formData.append('certificate', files.item(0), files.item(0).name);

    // Perform Upload File API Call
    httpModule.post(config['apiRootUrl'] + 'ssl/upload', formData, { headers }).subscribe(

      // Success
      res => {

        // Trigger Update Ref
        updateRef.trigger("update");

      },

      // Fail
      err => { snackBarService.httpErrorOccurred(err); }

    );

  }

}

// Upload Key File
export function uploadKeyFile(files: FileList, config, snackBarService, cookieService, httpModule, updateRef) {

  // Only One File Selected
  if(files.length == 1) {

    // Define API Authentication
    let token = cookieService.get('token');
    let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

    // Create Form Data
    let formData: FormData = new FormData();
    formData.append('key', files.item(0), files.item(0).name);

    // Perform Upload File API Call
    httpModule.post(config['apiRootUrl'] + 'ssl/upload', formData, { headers }).subscribe(

      // Success
      res => {

        // Trigger Update Ref
        updateRef.trigger("update");

      },

      // Fail
      err => { snackBarService.httpErrorOccurred(err); }

    );

  }

}

// Switch API Protocol
export function switchAPIProtocol(protocol, config, snackBarService, cookieService, httpModule) {

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Perform Switch Protocol API Call
  httpModule.post(config['apiRootUrl'] + 'protocol/api/switch', {'protocol': protocol}, { headers }).subscribe(

    // Success
    res => {

      // Wait
      syncLib.syncWait(5000);

      // Reload Page
      window.location.reload();

    },

    // Fail (Expected)
    err => {

      // Wait
      syncLib.syncWait(5000);

      // Reload Page
      window.location.reload();

    }

  );

}

// Switch GUI Protocol
export function switchGUIProtocol(protocol, config, snackBarService, cookieService, httpModule) {

  // Define API Authentication
  let token = cookieService.get('token');
  let headers: HttpHeaders = new HttpHeaders({"Authorization": "Token " + token});

  // Perform Switch Protocol API Call
  httpModule.post(config['apiRootUrl'] + 'protocol/gui/switch', {'protocol': protocol}, { headers }).subscribe(

    // Success
    res => {

      // Wait
      syncLib.syncWait(5000);

      // Navigate to New Page
      window.location.href = window.location.href.replace('https://', (protocol.toLowerCase() + '://')).replace('http://', (protocol.toLowerCase() + '://'));

    },

    // Fail (Expected)
    err => {

      // Wait
      syncLib.syncWait(5000);

      // Navigate to New Page
      window.location.href = window.location.href.replace('https://', (protocol.toLowerCase() + '://')).replace('http://', (protocol.toLowerCase() + '://'));

    }

  );

}

// Generate SSL Greeting
export function generateSSLGreeting(config, sslInfo) {

  // Valid and Active SSL
  if (hasValidSSL(sslInfo) && objLib.lookUpKey(sslInfo, 'expiryDate') && sslInfo['expiryDate'] && (getActiveAPIProtocol(config) == 'HTTPS') && (getActiveGUIProtocol(config) == 'HTTPS')) {

    // Determine Expiration Date
    let expirationDate = new Date(sslInfo['expiryDate'] + '+0000');

    // Determine Current Date
    let currentDate = new Date();

    // Calculate Days Before Expiration
    let daysToGo = (expirationDate.getTime() - currentDate.getTime())/(1000*60*60*24);

    // Expires Soon
    if ((daysToGo <= 30) && (daysToGo >= 0)) { return 'common.greetings.ssl.soon-expire'; }

    // Expired
    else if (daysToGo < 0) { return 'common.greetings.ssl.expired'; }

    // Valid
    else { return 'common.greetings.ssl.valid'; }

  }

  // No SSL
  else { return 'common.greetings.ssl.none'; }

}
