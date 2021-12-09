/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-community/
    Contact:    https://neatly.be/
*/


// Imports: Custom Services
import { DataService } from '@app/data.service';
import { TimezoneService } from '@app/timezone.service';
import { TranslationService } from '@app/translation.service';
import { LicenseService } from '@app/license.service';
import { SnackBarService } from '@app/snackbar.service';
import { RouteService } from '@app/route.service';


// Construct Service Dictionary
const serviceImportsDict = {
  'DataService': DataService,
  'TimezoneService': TimezoneService,
  'TranslationService': TranslationService,
  'LicenseService': LicenseService,
  'SnackBarService': SnackBarService,
  'RouteService': RouteService
};

// Construct Service List
const serviceImportsList = [DataService, TimezoneService, TranslationService, LicenseService, SnackBarService, RouteService];

// Get Service By Name
function getServiceImportByName(name) { return serviceImportsDict[name]; }


// Export Dicts, Lists & Functions
export { serviceImportsDict, serviceImportsList, getServiceImportByName };
