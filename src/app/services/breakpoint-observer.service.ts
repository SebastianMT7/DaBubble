import { DestroyRef, Injectable } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Directive, ElementRef } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})

export class BreakpointObserverService {

  /**
   * Initializes the BreakpointObserver to monitor screen size changes.
   * Updates the screen size state and boolean flags based on the active breakpoint.
   * Observes the following breakpoints:
   * - Breakpoints.XSmall
   * - Breakpoints.Small
   * - Breakpoints.Medium
   * - Breakpoints.Large
   * - Breakpoints.Tablet
   */
  private screenSizeSubject = new BehaviorSubject<'XSmall' | 'Small' | 'Medium' | 'Large'>('Large');
  screenSize$ = this.screenSizeSubject.asObservable();
  isXSmallOrSmall: boolean = false;
  isMedium: boolean = false;


  constructor(private breakpointObserver: BreakpointObserver) {
    this.initBreakpointObserver();
  }

  private initBreakpointObserver() {
    this.breakpointObserver
      .observe([
        Breakpoints.XSmall,
        Breakpoints.Small,
        Breakpoints.Medium,
        Breakpoints.Large,
        Breakpoints.Tablet
      ])
      .subscribe((result) => {
        if (result.breakpoints[Breakpoints.XSmall]) {
          this.screenSizeSubject.next('XSmall');
          this.isXSmallOrSmall = true;
          this.isMedium = false;
        } else if (result.breakpoints[Breakpoints.Small]) {
          this.screenSizeSubject.next('Small');
          this.isXSmallOrSmall = true;
          this.isMedium = false;
          //console.log('BREAKPOINT-SMALL', this.isXSmallOrSmall);

        } else if (result.breakpoints[Breakpoints.Medium] || result.breakpoints[Breakpoints.Tablet]) {
          this.screenSizeSubject.next('Medium');
          this.isXSmallOrSmall = false;
          this.isMedium = true;
          //console.log('BREAKPOINT-MEDIUM', this.isMedium);

        } else if (result.breakpoints[Breakpoints.Large]) {
          this.screenSizeSubject.next('Large');
          this.isXSmallOrSmall = false;
          this.isMedium = false;
        }
      });
  }

  /**
   * Getter for current screen size as a string ('XSmall', 'Small', 'Medium', 'Large').
   * @returns 'XSmall' | 'Small' | 'Medium' | 'Large'
   */
  getCurrentScreenSize(): 'XSmall' | 'Small' | 'Medium' | 'Large' {
    return this.screenSizeSubject.getValue();
  }

}
