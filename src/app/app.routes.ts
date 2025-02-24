import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './account-management/login/login.component';
import { RegisterComponent } from './account-management/register/register.component';
import { SelectAvatarComponent } from './account-management/select-avatar/select-avatar.component';
import { ChannelChatComponent } from './main/channel-chat/channel-chat.component';
import { MainComponent } from './main/main.component';
import { ResetPasswordComponent } from './account-management/reset-password/reset-password.component';
import { NewPasswordComponent } from './account-management/new-password/new-password.component';
import { ImprintComponent } from './account-management/policy/imprint/imprint.component';
import { PrivacyPolicyComponent } from './account-management/policy/privacy-policy/privacy-policy.component';
import { NgModule } from '@angular/core';

export const routes: Routes = [
    { path: '', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'avatar', component: SelectAvatarComponent },
    { path: 'reset-password', component: ResetPasswordComponent },
    { path: 'new-password', component: NewPasswordComponent },
    { path: 'main', component:  MainComponent},
    { path: 'imprint', component:  ImprintComponent},
    { path: 'privacy-policy', component:  PrivacyPolicyComponent},
    { path: '**', redirectTo: '', pathMatch: 'full' }, // Fallback-Route
];


@NgModule({
    imports: [
      RouterModule.forRoot(routes, { useHash: false }), // Kein Hash-Routing
    ],
    exports: [RouterModule],
  })
  export class AppRoutingModule {}