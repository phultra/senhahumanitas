import { Routes } from '@angular/router';
import { GeradorsenhaComponent } from './home/geradorsenha/geradorsenha.component';
import { OperadorComponent } from './home/operador/operador.component';
import { PainelComponent } from './home/painel/painel.component';
import { AdminComponent } from './admin/admin.component';
import { LoginComponent } from './login/login.component';

import { UsuariosComponent } from './admin/usuarios/usuarios.component';
import { RelatorioComponent } from './admin/relatorio/relatorio.component';
import { ChamarPacienteComponent } from './home/chamar-paciente/chamar-paciente.component';
import { MedicosComponent } from './admin/medicos/medicos.component';
import { ConsultoriosComponent } from './admin/consultorios/consultorios.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [

    {'path': '', component: GeradorsenhaComponent},
    {'path': 'inicio', component: GeradorsenhaComponent},
    {'path': 'operador', component: OperadorComponent},
    {'path': 'painel', component: PainelComponent},
    {'path': 'medico', component: ChamarPacienteComponent},
    {'path': 'login', component: LoginComponent},


    {'path': 'admin', component: AdminComponent, canActivate: [authGuard]},
    {'path': 'usuarios', component: UsuariosComponent, canActivate: [authGuard] },
    {'path': 'relatorio', component: RelatorioComponent, canActivate: [authGuard]},    
    {'path': 'medicos', component: MedicosComponent, canActivate: [authGuard]},
    {'path': 'consultorios', component: ConsultoriosComponent, canActivate: [authGuard]},
];

