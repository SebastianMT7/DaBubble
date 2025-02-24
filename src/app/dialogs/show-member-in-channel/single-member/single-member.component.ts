import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-single-member',
  standalone: true,
  imports: [],
  templateUrl: './single-member.component.html',
  styleUrl: './single-member.component.scss'
})
export class SingleMemberComponent {
 @Input() member: any;
}
