/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Required
import { Injectable } from '@angular/core';

// Imports: Default
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

// Imports: Config Loaders
import { AppConfig } from '@app/app.config';

// Imports: Libraries
import * as classLib from '@library/class';

// Declarations: JQuery
declare var $: any;


// Class Export Definition
@Injectable()
export class SnackBarService {

  // Constants: Default
  snackBarRef;


  // Constructor
  constructor(private snackBar: MatSnackBar, private appConfig: AppConfig) {

  }


  // Split Snackbar Content
  splitSnackbarContent(content) {
    let maxLength = 24;
    let contentLines = [''];
    let contentLine = 0;
    let i = 0;
    let strSplitLength = content.split(' ').length;
    for (let strSplitContent of content.split(' ')) {
      if ((contentLines[contentLine].length + (strSplitContent.length + 1)) <= maxLength) {
        if (i == (strSplitLength-1)) { contentLines[contentLine] += strSplitContent; }
        else { contentLines[contentLine] += strSplitContent + ' '; }
      }
      else {
        let j = 0;
        let slashSplitLength = strSplitContent.split('/').length;
        for (let slashSplitContent of strSplitContent.split('/')) {
          if ((contentLines[contentLine].length + (slashSplitContent.length + 1)) <= maxLength) {
            if (j == (slashSplitLength-1)) { contentLines[contentLine] += slashSplitContent; }
            else { contentLines[contentLine] += slashSplitContent + '/'; }
          }
          else {
            contentLine += 1;
            contentLines.push('');
            if ((j == (slashSplitLength-1)) && (i == (strSplitLength-1))) { contentLines[contentLine] += slashSplitContent; }
            else if (j != (slashSplitLength-1)) { contentLines[contentLine] += slashSplitContent + '/'; }
            else { contentLines[contentLine] += slashSplitContent + ' '; }
          }
          j += 1;
        }
      }
      i += 1;
    }
    if (contentLines[contentLines.length-1] == '') { contentLines.pop(); }
    return contentLines.join("\n");
  }

  // Dismiss Snackbar
  dismiss() {

    // Snack Bar Exists
    if (this.snackBarRef != null) { this.snackBarRef.dismiss(); }

    // Clear
    classLib.clearOverlayContainer();

  }

  // HTTP Error Occurred Snack Bar
  httpErrorOccurred(error, position = null) {

    // Dismiss Existing Snack Bar
    this.dismiss();

    // Set Config of Snack Bar
    const snackBarConfig = new MatSnackBarConfig();
    snackBarConfig.panelClass = ['snackbar-header-text'];

    // Determine Content
    let content = error.url.replace(`${this.appConfig.config['apiRootUrl']}`, '');
    if (content.startsWith('http://') || content.startsWith('https://')) {
      content = content.replace('http://', '');
      content = content.replace('https://', '');
      content = '/' + content.split('/').slice(1).join('/');
    }
    if (content.startsWith('plugin/') && content.includes('/action/')) { content = 'Plugin ' + content.split('/')[1].toLowerCase() + ': ' + 'action ' + content.split('/')[3].toLowerCase(); }
    else if (content.includes('/edit/') && (content.split('/')[1] == 'edit')) { content = 'Edit ' + content.split('/')[0].toLowerCase(); }
    else if (content.includes('/delete/') && (content.split('/')[1] == 'delete')) { content = 'Delete ' + content.split('/')[0].toLowerCase(); }
    else if (content.includes('/create') && (content.split('/')[1] == 'create')) { content = 'Create ' + content.split('/')[0].toLowerCase(); }
    else if (content.includes('/list') && (content.split('/')[1].split('&')[0] == 'list')) { content = 'Get ' + content.split('/')[0].toLowerCase() + ' list'; }
    else if (content.includes('/id/') && (content.split('/')[1] == 'id')) { content = 'Get ' + content.split('/')[0].toLowerCase() + ' by id'; }
    else {
      let nrOfSlashes = (content.split('/').length - 1)
      if (nrOfSlashes == 0) { content = content.toLowerCase(); }
      else if (nrOfSlashes == 1) { content = content.split('/')[1].toLowerCase() + ' ' + content.split('/')[0].toLowerCase(); }
    }

    // Clear
    classLib.clearOverlayContainer();

    // Open Snack Bar
    this.snackBarRef = this.snackBar.open('ERROR:' + ' ' + 'HTTP' + ' ' + error.status.toString() + "\n" + this.splitSnackbarContent(content), 'CLOSE', snackBarConfig);

    // Clear Overlay when Dismissed
    this.snackBarRef.afterDismissed().subscribe(() => { classLib.clearOverlayContainer(); });

    // Set Snackbar Overlay
    classLib.addOverlayClass('snackbar');

    // Set Overlay Container
    if (position) { classLib.addOverlayClass(position); }

    // Token Check (on Authentication failure only)
    if (error.status == 401) { $('#update-required').trigger("token-check"); }

  }

  // Invalid Credentials
  invalidCredentials(translate, routerModule, position = null) {

    // Dismiss Existing Snack Bar
    this.dismiss();

    // Set Config of Snack Bar
    const snackBarConfig = new MatSnackBarConfig();
    snackBarConfig.panelClass = ['snackbar-text'];

    // Clear
    classLib.clearOverlayContainer();

    // Open Snack Bar
    this.snackBarRef = this.snackBar.open(translate.instant('common.snackbar.message.invalidCredentials'), translate.instant('common.snackbar.button.close').toUpperCase(), snackBarConfig);

    // Clear Overlay when Dismissed
    this.snackBarRef.afterDismissed().subscribe(() => { classLib.clearOverlayContainer(); });

    // Set Snackbar Overlay
    classLib.addOverlayClass('snackbar');

    // Set Overlay Container
    if (position) { classLib.addOverlayClass(position); }

  }

  // Logon Error
  logonError(translate, routerModule, position = null) {

    // Dismiss Existing Snack Bar
    this.dismiss();

    // Set Config of Snack Bar
    const snackBarConfig = new MatSnackBarConfig();
    snackBarConfig.panelClass = ['snackbar-text'];

    // Clear
    classLib.clearOverlayContainer();

    // Open Snack Bar
    this.snackBarRef = this.snackBar.open(translate.instant('common.snackbar.message.logonError'), translate.instant('common.snackbar.button.close').toUpperCase(), snackBarConfig);

    // Clear Overlay when Dismissed
    this.snackBarRef.afterDismissed().subscribe(() => { classLib.clearOverlayContainer(); });

    // Set Snackbar Overlay
    classLib.addOverlayClass('snackbar');

    // Set Overlay Container
    if (position) { classLib.addOverlayClass(position); }

  }

  // Manual Log Out
  manualLogOut(translate, routerModule, position = null) {

    // Dismiss Existing Snack Bar
    this.dismiss();

    // Set Config of Snack Bar
    const snackBarConfig = new MatSnackBarConfig();
    snackBarConfig.panelClass = ['snackbar-header-text'];

    // Clear
    classLib.clearOverlayContainer();

    // Open Snack Bar
    this.snackBarRef = this.snackBar.open(translate.instant('common.snackbar.message.manualLogOut.title').toUpperCase() + "\n" + translate.instant('common.snackbar.message.manualLogOut.content'), translate.instant('common.snackbar.button.close').toUpperCase(), snackBarConfig);

    // Clear Overlay when Dismissed
    this.snackBarRef.afterDismissed().subscribe(() => { classLib.clearOverlayContainer(); });

    // Set Snackbar Overlay
    classLib.addOverlayClass('snackbar');

    // Set Overlay Container
    if (position) { classLib.addOverlayClass(position); }

  }

  // Expired Log Out
  expiredLogOut(translate, routerModule, position = null) {

    // Dismiss Existing Snack Bar
    this.dismiss();

    // Set Config of Snack Bar
    const snackBarConfig = new MatSnackBarConfig();
    snackBarConfig.panelClass = ['snackbar-header-text'];

    // Clear
    classLib.clearOverlayContainer();

    // Open Snack Bar
    this.snackBarRef = this.snackBar.open(translate.instant('common.snackbar.message.expiredLogOut.title').toUpperCase() + "\n" + translate.instant('common.snackbar.message.expiredLogOut.content'), translate.instant('common.snackbar.button.close').toUpperCase(), snackBarConfig);

    // Clear Overlay when Dismissed
    this.snackBarRef.afterDismissed().subscribe(() => { classLib.clearOverlayContainer(); });

    // Set Snackbar Overlay
    classLib.addOverlayClass('snackbar');

    // Set Overlay Container
    if (position) { classLib.addOverlayClass(position); }

  }

  // SSL Expire Soon Snack Bar
  sslExpireSoon(translate, routerModule, position = null) {

    // Dismiss Existing Snack Bar
    this.dismiss();

    // Set Config of Snack Bar
    const snackBarConfig = new MatSnackBarConfig();
    snackBarConfig.panelClass = ['snackbar-text'];

    // Clear
    classLib.clearOverlayContainer();

    // Open Snack Bar
    this.snackBarRef = this.snackBar.open(translate.instant('common.snackbar.message.sslExpireSoon'), translate.instant('common.snackbar.button.show').toUpperCase(), snackBarConfig);

    // Clear Overlay & Navigate when Dismissed
    this.snackBarRef.afterDismissed().subscribe(() => {

      // Clear
      classLib.clearOverlayContainer();

      // Navigate to SSL Page
      routerModule.navigate(['settings/ssl']);

    });

    // Set Snackbar Overlay
    classLib.addOverlayClass('snackbar');

    // Set Overlay Container
    if (position) { classLib.addOverlayClass(position); }

  }

  // SSL Expired Snack Bar
  sslExpired(translate, routerModule, position = null) {

    // Dismiss Existing Snack Bar
    this.dismiss();

    // Set Config of Snack Bar
    const snackBarConfig = new MatSnackBarConfig();
    snackBarConfig.panelClass = ['snackbar-text'];

    // Clear
    classLib.clearOverlayContainer();

    // Open Snack Bar
    this.snackBarRef = this.snackBar.open(translate.instant('common.snackbar.message.sslExpired'), translate.instant('common.snackbar.button.show').toUpperCase(), snackBarConfig);

    // Clear Overlay & Navigate when Dismissed
    this.snackBarRef.afterDismissed().subscribe(() => {

      // Clear
      classLib.clearOverlayContainer();

      // Navigate to SSL Page
      routerModule.navigate(['settings/ssl']);

    });

    // Set Snackbar Overlay
    classLib.addOverlayClass('snackbar');

    // Set Overlay Container
    if (position) { classLib.addOverlayClass(position); }

  }

}
