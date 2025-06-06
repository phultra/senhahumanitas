import { Component } from '@angular/core';
import { MenuComponent } from "../menu/menu/menu.component";
import { FormsModule } from '@angular/forms';
import { Database, push, ref, set, child, get } from '@angular/fire/database';

@Component({
  selector: 'app-medicos',
  standalone: true,
  imports: [MenuComponent, FormsModule],
  templateUrl: './medicos.component.html',
  styleUrl: './medicos.component.scss'
})
export class MedicosComponent {
  nome: string = '';

  constructor(private db: Database) {}

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
}