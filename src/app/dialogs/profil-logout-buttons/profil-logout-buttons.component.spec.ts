import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfilLogoutButtonsComponent } from './profil-logout-buttons.component';

describe('ProfilLogoutButtonsComponent', () => {
  let component: ProfilLogoutButtonsComponent;
  let fixture: ComponentFixture<ProfilLogoutButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilLogoutButtonsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProfilLogoutButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
