import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { Logincomponent } from './components/logincomponent/logincomponent';
import { Registrocomponent } from './components/registrocomponent/registrocomponent';
import { Usuarioscomponent } from './components/usuarioscomponent/usuarioscomponent';

const routes: Routes = [
  { path: '', redirectTo: 'usuarios', pathMatch: 'full' },
  { path: 'login', component: Logincomponent },
  { path: 'registro', component: Registrocomponent },
  { path: 'usuarios', component: Usuarioscomponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'usuarios', pathMatch: 'full' },
];

// useHash: al servir el build desde Tomcat no hace falta reescribir rutas para /usuarios, /login...
@NgModule({
  imports: [RouterModule.forRoot(routes, { useHash: true })],
  exports: [RouterModule],
})
export class AppRoutingModule {}
