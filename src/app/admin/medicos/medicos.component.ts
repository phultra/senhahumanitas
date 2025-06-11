import { Component } from '@angular/core';
import { MenuComponent } from "../menu/menu/menu.component";
import { FormsModule } from '@angular/forms';
import { Database, push, ref, set, child, get } from '@angular/fire/database';
import { AdminService } from '../../service/admin/admin.service';
import { Medicos } from '../../interface/medicos';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-medicos',
  standalone: true,
  imports: [MenuComponent, FormsModule, CommonModule],
  templateUrl: './medicos.component.html',
  styleUrl: './medicos.component.scss'
})
export class MedicosComponent {
  nome: string = '';
  medicos:Medicos[] = [];

  constructor(
    private db: Database,
    private adminService: AdminService
  ) {}
  ngOnInit() {
    this.getMedicos();
  }

 async getMedicos(){
  await this.adminService.getMedicoCadastrados().subscribe(async dados => {
    this.medicos = await dados;
    console.log(dados);
   })
  }

  salvarMedico() {
    if (this.nome.trim()) {
      const medicosRef = ref(this.db, `medicos`)

      // Obtém os médicos existentes para calcular o próximo número
      get(child(medicosRef, '/')).then((snapshot) => {
        const medicos = snapshot.exists() ? snapshot.val() : {};
        const numero = Object.keys(medicos).length + 1; // Calcula o próximo número

        const newMedicoRef = push(medicosRef);
        set(newMedicoRef, { nome: this.nome, numero: numero })
          .then(() => {
            this.nome = ''; // Limpa o campo após salvar
            alert('Médico salvo com sucesso!');
          })
          .catch((error) => {
            console.error('Erro ao salvar médico:', error);
            alert('Erro ao salvar médico. Tente novamente.');
          });
      }).catch((error) => {
        console.error('Erro ao obter médicos existentes:', error);
        alert('Erro ao salvar médico. Tente novamente.');
      });
    } else {
      alert('Por favor, insira um nome.');
    }
  }



  excluirmedico(med: Medicos) {

    this.adminService.deletaMedico(med.key);
  }

  

}