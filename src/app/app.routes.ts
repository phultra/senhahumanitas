import { Routes } from '@angular/router';
import { GeradorsenhaComponent } from './home/geradorsenha/geradorsenha.component';
import { OperadorComponent } from './home/operador/operador.component';
import { PainelComponent } from './home/painel/painel.component';
import { AdminComponent } from './admin/admin.component';
import { LoginComponent } from './login/login.component';
import { AvaliarComponent } from './avaliar/avaliar.component';
import { SetoresComponent } from './admin/setores/setores.component';
import { UsuariosComponent } from './admin/usuarios/usuarios.component';
import { RelatorioComponent } from './admin/relatorio/relatorio.component';
import { PainelMedicoComponent } from './home/painel-medico/painel-medico.component'; 
import { ChamarPacienteComponent } from './home/chamar-paciente/chamar-paciente.component';

export const routes: Routes = [

    {'path': '', component: GeradorsenhaComponent},
    {'path': 'inicio', component: GeradorsenhaComponent},
    {'path': 'operador', component: OperadorComponent},
    {'path': 'painel', component: PainelComponent},
    {'path': 'admin', component: AdminComponent},
    {'path': 'login', component: LoginComponent},
    {'path': 'avaliar', component: AvaliarComponent},
    {'path': 'setores', component: SetoresComponent},
    {'path': 'usuarios', component: UsuariosComponent},
    {'path': 'relatorio', component: RelatorioComponent},
    {'path': 'painelMedico', component: PainelMedicoComponent},
    {'path': 'chamarPaciente', component: ChamarPacienteComponent},
];

