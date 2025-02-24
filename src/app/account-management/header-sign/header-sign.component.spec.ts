import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderSignComponent } from './header-sign.component';

describe('HeaderSignComponent', () => {
  let component: HeaderSignComponent;
  let fixture: ComponentFixture<HeaderSignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderSignComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeaderSignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
