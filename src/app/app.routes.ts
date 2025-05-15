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

export const routes: Routes = [

    {'path': '', component: GeradorsenhaComponent},
    {'path': 'inicio', component: GeradorsenhaComponent},
    {'path': 'operador', component: OperadorComponent},
    {'path': 'painel', component: PainelComponent},
    {'path': 'admin', component: AdminComponent},
    {'path': 'login', component: LoginComponent},
   
    {'path': 'usuarios', component: UsuariosComponent},
    {'path': 'relatorio', component: RelatorioComponent},    
    {'path': 'chamarPaciente', component: ChamarPacienteComponent},
    {'path': 'medicos', component: MedicosComponent},
    {'path': 'consultorios', component: ConsultoriosComponent},
];

