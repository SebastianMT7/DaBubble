import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ShowMemberInChannelComponent } from './show-member-in-channel.component';

describe('ShowMemberInChannelComponent', () => {
  let component: ShowMemberInChannelComponent;
  let fixture: ComponentFixture<ShowMemberInChannelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ShowMemberInChannelComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ShowMemberInChannelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
