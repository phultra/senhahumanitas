import { Routes } from '@angular/router';
import { GeradorsenhaComponent } from './home/geradorsenha/geradorsenha.component';
import { OperadorComponent } from './home/operador/operador.component';
import { PainelComponent } from './home/painel/painel.component';
import { AdminComponent } from './home/admin/admin.component';
import { LoginComponent } from './login/login.component';
import { AvaliarComponent } from './avaliar/avaliar.component';

export const routes: Routes = [

    {'path': '', component: GeradorsenhaComponent},
    {'path': 'inicio', component: GeradorsenhaComponent},
    {'path': 'operador', component: OperadorComponent},
    {'path': 'painel', component: PainelComponent},
    {'path': 'admin', component: AdminComponent},
    {'path': 'login', component: LoginComponent},
    {'path': 'avaliar', component: AvaliarComponent},
];

