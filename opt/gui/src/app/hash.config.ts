/*
    Author:     Thomas D'haenens
    License:    GPL-3.0
    Link:       https://github.com/BENEATLY/neat-start-orig/
    Contact:    https://neatly.be/
*/


// Imports: Required
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';


// Class Export Definition
@Injectable()
export class HashConfig {

  // Define Properties
  public config: Object = null;


  // Constructor
  constructor(private http: HttpClient) { }


  // Get Config by Key
  getConfig(key: any) { return this.config[key]; }

  // Get All Config
  getAllConfig() { return this.config; }

  // Load Config
  load() {
    return new Promise(
      (resolve, reject) => {

        // Refuse Caching
        let headers: HttpHeaders = new HttpHeaders({'Cache-Control': 'no-cache, no-store, must-revalidate, post-check=0, pre-check=0', 'Pragma': 'no-cache', 'Expires': '0'});

        // Get Config
        this.http.get('./assets/hashes/config.json', { headers }).subscribe(
          (res: any) => { this.config = res; resolve(true); }
        );

      }
    );
  }

}
