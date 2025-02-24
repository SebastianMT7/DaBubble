import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddToChoosenChannelComponent } from './add-to-choosen-channel.component';

describe('AddToChoosenChannelComponent', () => {
  let component: AddToChoosenChannelComponent;
  let fixture: ComponentFixture<AddToChoosenChannelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddToChoosenChannelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddToChoosenChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
