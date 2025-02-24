import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilButtonMobileComponent } from './profil-button-mobile.component';

describe('ProfilButtonMobileComponent', () => {
  let component: ProfilButtonMobileComponent;
  let fixture: ComponentFixture<ProfilButtonMobileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilButtonMobileComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfilButtonMobileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
